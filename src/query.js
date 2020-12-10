import { writable, readable, derived } from "svelte/store";

import { defaultClientManager } from "./client";
import QueryManager from "./queryManager";

export default function query(query, options = {}) {
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
  const sync = (variables, options) => queryManager.load([query, variables], options);

  if (options.initialSearch) {
    sync(options.initialSearch);
  }

  return {
    queryState: derived(queryStore, $state => ({ ...$state, softReset: queryManager.softReset })),
    sync
  };
}
