import { writable, derived } from "svelte/store";

import Client, { defaultClientManager } from "./client";
import MutationManager from "./mutationManager";

type MutationOptions = {
  client?: Client;
}

export default function mutation(mutation: string, options: MutationOptions = {}) {
  const client = options.client || defaultClientManager.getDefaultClient();
  const mutationManager = new MutationManager({ client }, mutation);

  const mutationStore = writable(mutationManager.currentState, () => () => {
    mutationManager.setState = () => {};
  });

  mutationManager.setState = mutationStore.set;

  return { mutationState: derived(mutationStore, $state => $state) };
}
