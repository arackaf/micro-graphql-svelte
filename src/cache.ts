type GraphQLResponse = {
  errors?: unknown;
  data?: unknown;
};

type CachedEntry = {
  error?: unknown;
  data?: unknown;
};

export default class Cache {
  constructor(private cacheSize = DEFAULT_CACHE_SIZE) {
    this.cacheSize = cacheSize;
  }
  _cache = new Map<string, Promise<GraphQLResponse> | CachedEntry>([]);
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

  set(key: string, results: CachedEntry) {
    this._cache.set(key, results);
  }

  clearCache() {
    this._cache.clear();
  }

  setPendingResult(graphqlQuery: string, promise: Promise<GraphQLResponse>) {
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

  setResults(promise: Promise<unknown>, cacheKey: string, resp: GraphQLResponse, err: unknown = null) {
    let cache = this._cache;
    if (this.noCaching) {
      return;
    }

    //cache may have been cleared while we were running. If so, we'll respect that, and not touch the cache, but
    //we'll still use the results locally
    if (cache.get(cacheKey) !== promise) return;

    if (err) {
      cache.set(cacheKey, { data: null, error: err });
    } else {
      if (resp.errors) {
        cache.set(cacheKey, { data: null, error: resp.errors });
      } else {
        cache.set(cacheKey, { data: resp.data, error: null });
      }
    }
  }

  getFromCache(key: string, ifPending: (entry: unknown) => void, ifResults: (entry: unknown) => void, ifNotFound: () => void) {
    let cache = this._cache;
    if (this.noCaching) {
      ifNotFound();
    } else {
      let cachedEntry = cache.get(key);
      if (cachedEntry) {
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
