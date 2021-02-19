import { writable, derived, Writable } from "svelte/store";
import Client, { defaultClientManager } from "./client";

import QueryManager, { QueryLoadOptions, QueryOptions, QueryState } from "./queryManager";

export default function query<TResults = unknown>(query: string, options: Partial<QueryOptions<TResults>> = {}) {
  let queryManager: QueryManager<TResults>;
  const queryStore = writable<QueryState<TResults>>(QueryManager.initialState, () => {
    options.activate && options.activate(queryStore);
    queryManager.activate();
    return () => {
      options.deactivate && options.deactivate(queryStore);
      queryManager.dispose();
    };
  });

  const client: Client | null = options.client || defaultClientManager.getDefaultClient();
  if (client == null) {
    throw "Default Client not configured";
  }
  
  queryManager = new QueryManager<TResults>({ query, client, cache: options?.cache, setState: queryStore.set }, options);
  const sync = (variables: unknown, options?: QueryLoadOptions) => queryManager.load([query, variables], options);

  if (options.initialSearch) {
    sync(options.initialSearch);
  }

  return {
    queryState: derived(queryStore, $state => ({ ...$state, softReset: queryManager.softReset })),
    sync
  };
}