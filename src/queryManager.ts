import { Writable } from "svelte/store";
import Client, { SubscriptionItem } from "./client";
import Cache, { GraphQLResponse } from "./cache";

export type QueryOptions = {
  client: Client;
  cache?: Cache;
  initialSearch?: string;
  activate?: (store: Writable<any>) => void;
  deactivate?: (store: Writable<any>) => void;
  postProcess: (resp: unknown) => unknown;
  onMutation: SubscriptionItem | SubscriptionItem[]
}

export type QueryState = {
  loading: boolean;
  loaded: boolean;
  data: unknown;
  error: unknown;
  reload: () => void;
  clearCache: () => void;
  clearCacheAndReload: () => void;
  currentQuery: string;
}

export type QueryLoadOptions = {
  force?: boolean;
  active?: boolean;
}

type QueryManagerOptions = {
  query: string;
  client: Client;
  setState: (newState: Partial<QueryState>) => void;
  cache?: Cache;
}

export default class QueryManager {
  query: string;
  client: Client;
  active = true;
  setState: (newState: Object) => void;
  options: any;
  cache: Cache;
  postProcess?: (resp: unknown) => unknown;
  currentUri = "";

  unregisterQuery?: () => void;

  currentPromise?: Promise<unknown>;

  mutationSubscription?: () => void;
  static initialState = {
    loading: false,
    loaded: false,
    data: null,
    error: null,
    currentQuery: ""
  };
  currentState: QueryState;

  constructor({ query, client, setState, cache }: QueryManagerOptions, options: Partial<QueryOptions>) {
    this.query = query;
    this.client = client;
    this.setState = setState;
    this.options = options;
    this.cache = cache || client.getCache(query) || client.newCacheForQuery(query);
    this.postProcess = options?.postProcess;

    if (typeof options?.onMutation === "object") {
      if (!Array.isArray(options.onMutation)) {
        options.onMutation = [options.onMutation];
      }
    }
    this.currentState = {
      ...QueryManager.initialState,
      reload: this.reload,
      clearCache: () => this.cache.clearCache(),
      clearCacheAndReload: this.clearCacheAndReload,
    };
  }
  isActive = () => this.active;
  updateState = (newState: Partial<QueryState>) => {
    Object.assign(this.currentState, newState);
    this.setState(Object.assign({}, this.currentState));
  };
  refresh = () => {
    this.load();
  };
  softReset = (newResults: unknown) => {
    if (newResults) {
      this.updateState({ data: newResults });
    }
    this.cache.clearCache();
  };
  hardReset = () => {
    this.cache.clearCache();
    this.reload();
  };
  clearCacheAndReload = () => {
    this.cache.clearCache();
    this.reload();
  };
  reload = () => {
    this.execute();
  };
  load(packet?: [string, unknown], options?: QueryLoadOptions) {
    let { force, active } = options || {};

    if (typeof active !== "undefined") {
      this.active = active;
    }
    if (!this.isActive()) {
      return;
    }

    if (packet) {
      const [query, variables] = packet;
      let graphqlQuery = this.client.getGraphqlQuery({ query, variables });
      if (force || graphqlQuery != this.currentUri) {
        this.currentUri = graphqlQuery;
      } else {
        return;
      }
    }

    let graphqlQuery = this.currentUri;
    this.cache.getFromCache(
      graphqlQuery!,
      promise => {
        Promise.resolve(promise)
          .then(() => {
            //cache should now be updated, unless it was cleared. Either way, re-run this method
            this.load();
          })
          .catch(err => {
            this.load();
          });
      },
      cachedEntry => {
        this.updateState({ data: cachedEntry.data, error: cachedEntry.error || null, loading: false, loaded: true, currentQuery: graphqlQuery });
      },
      () => this.execute()
    );
  }
  execute() {
    let graphqlQuery = this.currentUri;
    this.updateState({ loading: true });
    let promise = this.client.runUri(this.currentUri);

    if (this.postProcess != null) {
      promise = promise.then(resp => {
        return Promise.resolve(this.postProcess!(resp)).then(newRespMaybe => newRespMaybe || resp);
      });
    }

    this.cache.setPendingResult(graphqlQuery, promise);
    this.handleExecution(promise, graphqlQuery);
  }
  handleExecution = (promise: Promise<GraphQLResponse>, cacheKey: string) => {
    this.currentPromise = promise;
    Promise.resolve(promise)
      .then(resp => {
        if (this.currentPromise !== promise) {
          return;
        }
        this.cache.setResults(promise, cacheKey, resp);

        if (resp.errors) {
          this.updateState({ loaded: true, loading: false, data: null, error: resp.errors || null, currentQuery: cacheKey });
        } else {
          this.updateState({ loaded: true, loading: false, data: resp.data, error: null, currentQuery: cacheKey });
        }
      })
      .catch(err => {
        this.cache.setResults(promise, cacheKey, void 0, err);
        this.updateState({ loaded: true, loading: false, data: null, error: err, currentQuery: cacheKey });
      });
  };
  activate() {
    if (typeof this.options.onMutation === "object") {
      this.mutationSubscription = this.client.subscribeQuery(this.options.onMutation, {
        cache: this.cache,
        softReset: this.softReset,
        hardReset: this.hardReset,
        refresh: this.refresh,
        currentResults: () => this.currentState.data,
        isActive: this.isActive
      });
    }
    this.unregisterQuery = this.client.registerQuery(this.query, this.refresh);
  }
  dispose() {
    this.mutationSubscription && this.mutationSubscription();
    this.unregisterQuery && this.unregisterQuery();
  }
}
