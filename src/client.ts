import Cache, { DEFAULT_CACHE_SIZE } from "./cache";
import {
  BasicSubscriptionEntry,
  FullSubscriptionEntry,
  MinimalOnMutationPayload,
  OnMutationPayload,
  SubscriptionEntry,
  SubscriptionItem
} from "./queryTypes";

type QueryPacket = {
  query: string;
  variables: unknown;
};

type ClientOptions = {
  endpoint: string;
  cacheSize?: number;
  noCaching?: boolean;
};

type OnMutationQuerySetup = {
  cache: Cache;
  softReset: (newResults: Object) => void;
  hardReset: () => void;
  refresh: () => void;
  currentResults: () => unknown;
  isActive: () => boolean;
};

export default class Client {
  private caches = new Map<string, Cache>();
  private mutationListeners = new Set<{ subscription: (BasicSubscriptionEntry | FullSubscriptionEntry)[]; options?: OnMutationQuerySetup }>();
  private forceListeners = new Map<string, Set<() => void>>();
  private cacheSize?: number;
  private fetchOptions?: RequestInit;
  endpoint: string;

  constructor(props: ClientOptions) {
    if (props.noCaching != null && props.cacheSize != null) {
      throw "Both noCaching, and cacheSize are specified. At most one of these options can be included";
    }

    if (props.noCaching) {
      props.cacheSize = 0;
    }

    this.endpoint = props.endpoint;
    Object.assign(this, { cacheSize: DEFAULT_CACHE_SIZE }, props);
  }
  get cacheSizeToUse() {
    if (this.cacheSize != null) {
      return this.cacheSize;
    }
    return DEFAULT_CACHE_SIZE;
  }
  getCache<TData>(query: string): Cache<TData> {
    return this.caches.get(query) as Cache<TData>;
  }
  preload(query: string, variables: unknown) {
    let cache = this.getCache(query);
    if (cache == null) {
      cache = this.newCacheForQuery(query);
    }

    let graphqlQuery = this.getGraphqlQuery({ query, variables });

    let promiseResult;
    cache.getFromCache(
      graphqlQuery,
      promise => {
        promiseResult = promise;
        /* already preloading - cool */
      },
      cachedEntry => {
        promiseResult = cachedEntry;
        /* already loaded - cool */
      },
      () => {
        let promise = this.runUri(graphqlQuery);
        cache.setPendingResult(graphqlQuery, promise);
        promiseResult = promise;
        promise.then(resp => {
          cache.setResults(promise, graphqlQuery, resp);
        });
      }
    );
    return promiseResult;
  }
  newCacheForQuery<TData>(query: string) {
    let newCache = new Cache<TData>(this.cacheSizeToUse);
    this.setCache(query, newCache);
    return newCache;
  }
  setCache(query: string, cache: Cache) {
    this.caches.set(query, cache);
  }
  runQuery(query: string, variables: unknown) {
    return this.runUri(this.getGraphqlQuery({ query, variables }));
  }
  runUri(uri: string) {
    return fetch(uri, this.fetchOptions || void 0).then(resp => resp.json());
  }
  getGraphqlQuery({ query, variables }: QueryPacket) {
    return `${this.endpoint}?query=${encodeURIComponent(query)}${
      typeof variables === "object" ? `&variables=${encodeURIComponent(JSON.stringify(variables))}` : ""
    }`;
  }
  subscribeMutation(subscription: SubscriptionItem | SubscriptionItem[]) {
    if (!Array.isArray(subscription)) {
      subscription = [subscription];
    }

    const entries: BasicSubscriptionEntry[] = subscription.map(entry => ({ ...entry, type: "Basic" }));
    const packet = { subscription: entries };
    this.mutationListeners.add(packet);

    return () => this.mutationListeners.delete(packet);
  }
  subscribeQuery(subscription: FullSubscriptionEntry[], options: OnMutationQuerySetup) {
    if (!Array.isArray(subscription)) {
      subscription = [subscription];
    }
    const packet = { subscription, options };

    this.mutationListeners.add(packet);

    return () => this.mutationListeners.delete(packet);
  }
  forceUpdate(query: string) {
    let updateListeners = this.forceListeners.get(query);
    if (updateListeners) {
      for (let refresh of updateListeners) {
        refresh();
      }
    }
  }
  registerQuery(query: string, refresh: () => void) {
    if (!this.forceListeners.has(query)) {
      this.forceListeners.set(query, new Set([]));
    }
    this.forceListeners.get(query)?.add(refresh);

    return () => this.forceListeners.get(query)?.delete(refresh);
  }
  processMutation(mutation: string, variables: unknown) {
    return Promise.resolve(this.runMutation(mutation, variables)).then(resp => {
      let mutationKeys = Object.keys(resp);
      let mutationKeysLookup = new Set(mutationKeys);
      [...this.mutationListeners].forEach(({ subscription, options }) => {
        subscription.forEach(sub => {
          if (options && typeof options.isActive === "function") {
            if (!options.isActive()) {
              return;
            }
          }

          if (typeof sub.when === "string") {
            if (mutationKeysLookup.has(sub.when)) {
              this.executeMutationSubscription(sub, options, resp, variables);
            }
          } else if (sub.when instanceof RegExp) {
            if ([...mutationKeysLookup].some(k => (sub.when as RegExp).test(k))) {
              this.executeMutationSubscription(sub, options, resp, variables);
            }
          }
        });
      });
      return resp;
    });
  }
  private executeMutationSubscription(sub: SubscriptionEntry, options: OnMutationQuerySetup | undefined, resp: unknown, variables: unknown) {
    const refreshActiveQueries = (query: string) => this.forceUpdate(query);

    if (sub.type === "Basic") {
      let basicArgs: MinimalOnMutationPayload = {
        refreshActiveQueries
      };
      sub.run(basicArgs, resp, variables);
    } else {
      let fullArgs: OnMutationPayload = {
        ...(options as OnMutationQuerySetup),
        currentResults: options!.currentResults(),
        refreshActiveQueries
      };
      sub.run(fullArgs, resp, variables);
    }
  }
  runMutation(mutation: string, variables: unknown) {
    let { headers = {}, ...otherOptions } = this.fetchOptions || {};
    return fetch(this.endpoint, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers
      },
      ...otherOptions,
      body: JSON.stringify({
        query: mutation,
        variables
      })
    })
      .then(resp => resp.json())
      .then(resp => resp.data);
  }
}

class DefaultClientManager {
  defaultClient: Client | null = null;
  setDefaultClient = (client: Client) => (this.defaultClient = client);
  getDefaultClient = () => this.defaultClient;
}

export const defaultClientManager = new DefaultClientManager();
