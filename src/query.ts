import { writable, derived, Writable } from "svelte/store";
import Client, { defaultClientManager } from "./client";

import QueryManager, { QueryLoadOptions, QueryOptions, QueryState } from "./queryManager";

export default function query<TResults = unknown, TArgs = unknown>(query: string, options: Partial<QueryOptions<TResults, TArgs>> = {}) {
  let queryManager: QueryManager<TResults, TArgs>;
  const queryStore = writable<QueryState<TResults>>(QueryManager.initialState, () => {
    options.activate && options.activate(queryStore);
    queryManager.activate();
    return () => {
      options.deactivate && options.deactivate(queryStore);
      queryManager.dispose();
    };
  });
  const resultsStore = writable<TResults | null>(null);

  const client: Client | null = options.client || defaultClientManager.getDefaultClient();
  if (client == null) {
    throw "Default Client not configured";
  }

  const setState = (newState: any) => {
    const existingState = queryManager.currentState;
    queryStore.set(Object.assign({}, existingState, newState));
    if ("data" in newState) {
      resultsStore.set(newState.data);
    }
  };

  queryManager = new QueryManager<TResults, TArgs>({ query, client, cache: options?.cache, setState }, options);
  const sync = (variables: unknown, options?: QueryLoadOptions) => queryManager.load([query, variables], options);

  if (options.initialSearch) {
    sync(options.initialSearch);
  }

  return {
    queryState: derived(queryStore, $state => ({ ...$state, softReset: queryManager.softReset })),
    resultsState: resultsStore,
    sync
  };
}
