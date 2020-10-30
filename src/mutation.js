import { writable, readable, derived } from "svelte/store";

import { defaultClientManager } from "./client";
import MutationManager from "./mutationManager";

export default function mutation(mutation, options = {}) {
  const client = options.client || defaultClientManager.getDefaultClient();
  const mutationManager = new MutationManager({ client }, mutation);

  const mutationStore = writable(mutationManager.currentState, () => () => {
    mutationManager.setState = () => {};
  });

  mutationManager.setState = mutationStore.set;

  return { mutationState: derived(mutationStore, $state => $state) };
}
