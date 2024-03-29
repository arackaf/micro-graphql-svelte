import { GraphQLResponse, CachedEntry } from "./queryTypes";

export default class Cache<TData = unknown> {
  constructor(private cacheSize = DEFAULT_CACHE_SIZE) {
    this.cacheSize = cacheSize;
  }
  _cache = new Map<string, Promise<GraphQLResponse<TData>> | CachedEntry<TData>>([]);
  get noCaching() {
    return !this.cacheSize;
  }

  get keys() {
    return [...this._cache.keys()];
  }

  get entries() {
    return [...this._cache];
  }

  get(key: string) {
    return this._cache.get(key);
  }

  set(key: string, results: CachedEntry<TData>) {
    this._cache.set(key, results);
  }

  clearCache() {
    this._cache.clear();
  }

  setPendingResult(graphqlQuery: string, promise: Promise<GraphQLResponse<TData>>) {
    let cache = this._cache;
    //front of the line now, to support LRU ejection
    if (!this.noCaching) {
      cache.delete(graphqlQuery);
      if (cache.size === this.cacheSize) {
        //maps iterate entries and keys in insertion order - zero'th key should be oldest
        cache.delete([...cache.keys()][0]);
      }
      cache.set(graphqlQuery, promise);
    }
  }

  setResults(promise: Promise<unknown>, cacheKey: string, resp?: GraphQLResponse<TData>, err: Object | null = null) {
    let cache = this._cache;
    if (this.noCaching) {
      return;
    }

    //cache may have been cleared while we were running. If so, we'll respect that, and not touch the cache, but
    //we'll still use the results locally
    if (cache.get(cacheKey) !== promise) return;

    if (err != null) {
      cache.set(cacheKey, { data: null, error: err });
    } else if (resp != null) {
      if (resp.errors) {
        cache.set(cacheKey, { data: null, error: resp.errors });
      } else {
        cache.set(cacheKey, { data: resp.data, error: null });
      }
    }
  }

  getFromCache(key: string, ifPending: (p: Promise<unknown>) => void, ifResults: (entry: CachedEntry<TData>) => void, ifNotFound: () => void) {
    let cache = this._cache;
    if (this.noCaching) {
      ifNotFound();
    } else {
      let cachedEntry = cache.get(key);
      if (cachedEntry != null) {
        if (cachedEntry instanceof Promise) {
          ifPending(cachedEntry);
        } else {
          //re-insert to put it at the fornt of the line
          cache.delete(key);
          this.set(key, cachedEntry);
          ifResults(cachedEntry);
        }
      } else {
        ifNotFound();
      }
    }
  }
}

export const DEFAULT_CACHE_SIZE = 10;
