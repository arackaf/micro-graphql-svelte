import { writable, derived } from "svelte/store";

import Client, { defaultClientManager } from "./client";
import MutationManager from "./mutationManager";

type MutationOptions = {
  client?: Client;
}

export default function mutation(mutation: string, options: MutationOptions = {}) {
  const client = options.client || defaultClientManager.getDefaultClient();

  if (client == null) {
    throw "Default client not configured";
  }

  const mutationManager = new MutationManager({ client }, mutation);

  return { mutationState: derived(mutationManager.mutationStore, $state => $state) };
}
