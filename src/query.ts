import { writable, derived, Writable } from "svelte/store";
import Client, { defaultClientManager } from "./client";
import Cache from "./cache";

import QueryManager, { QueryLoadOptions } from "./queryManager";

type QueryOptions = {
  client?: Client;
  cache?: Cache;
  initialSearch?: string;
  activate?: (store: Writable<any>) => void;
  deactivate?: (store: Writable<any>) => void;
}

export default function query(query, options: QueryOptions = {}) {
  let queryManager;
  const queryStore = writable(QueryManager.initialState, () => {
    options.activate && options.activate(queryStore);
    queryManager.activate();
    return () => {
      options.deactivate && options.deactivate(queryStore);
      queryManager.dispose();
    };
  });

  const client = options.client || defaultClientManager.getDefaultClient();
  queryManager = new QueryManager({ query, client, cache: options.cache, setState: queryStore.set }, options);
  const sync = (variables, options?: QueryLoadOptions) => queryManager.load([query, variables], options);

  if (options.initialSearch) {
    sync(options.initialSearch);
  }

  return {
    queryState: derived(queryStore, $state => ({ ...$state, softReset: queryManager.softReset })),
    sync
  };
}