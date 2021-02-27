import { derived, Readable } from "svelte/store";

import Client, { defaultClientManager } from "./client";
import MutationManager from "./mutationManager";
import { MutationState } from "./mutationTypes";

type MutationOptions = {
  client?: Client;
}

export default function mutation<TResults = unknown>(mutation: string, options: MutationOptions = {}): { mutationState: Readable<MutationState<TResults>> } {
  const client = options.client || defaultClientManager.getDefaultClient();

  if (client == null) {
    throw "Default client not configured";
  }

  const mutationManager = new MutationManager<TResults>({ client }, mutation);

  return { mutationState: derived(mutationManager.mutationStore, $state => $state) };
}
