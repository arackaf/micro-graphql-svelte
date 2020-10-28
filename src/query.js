import { writable, readable, derived } from "svelte/store";

import { defaultClientManager } from "./client";
import QueryManager from "./queryManager";

export function loadQuery(query, options = {}) {
  const queryStore = writable(QueryManager.initialState, () => () => {
    queryManager.dispose();
  });

  const client = options.client || defaultClientManager.getDefaultClient();
  const queryManager = new QueryManager({ query, client, cache: options.cache, setState: queryStore.set }, options);

  return {
    queryState: derived(queryStore, $state => $state),
    sync: (variables, { active } = {}) => queryManager.load([query, variables])
  };
}

