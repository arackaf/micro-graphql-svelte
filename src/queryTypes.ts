import Cache from "./cache";

export type GraphQLResponse<TData> = {
  errors?: unknown;
  data?: TData;
};

export type CachedEntry<TData> = {
  error?: unknown;
  data?: TData;
};

export type QueryPacket = {
  query: string;
  variables: unknown;
};

export type ClientOptions = {
  endpoint: string;
  cacheSize?: number;
  noCaching?: boolean;
};

export type OnMutationQuerySetup = {
  cache: Cache;
  softReset: (newResults: Object) => void;
  hardReset: () => void;
  refresh: () => void;
  currentResults: () => unknown;
  isActive: () => boolean;
};

export type MinimalOnMutationPayload = {
  refreshActiveQueries: (query: string) => void;
};

export type OnMutationPayload<TResults = unknown> = {
  cache: Cache<TResults>;
  softReset: (newResults: Object) => void;
  hardReset: () => void;
  refresh: () => void;
  currentResults: TResults;
  isActive: () => boolean;
  refreshActiveQueries: (query: string) => void;
};
export type SubscriptionTrigger = string | RegExp;

export type SubscriptionItem = {
  when: SubscriptionTrigger;
  run(onChangeOptions: MinimalOnMutationPayload, resp?: any, variables?: any): void;
};
export type BasicSubscriptionEntry = SubscriptionItem & {
  type: "Basic";
};

export type FullSubscriptionItem<TResults = unknown> = {
  when: SubscriptionTrigger;
  run(onChangeOptions: OnMutationPayload<TResults>, resp?: unknown, variables?: unknown): void;
};

export type FullSubscriptionEntry = FullSubscriptionItem & {
  type: "Full";
};

export type SubscriptionEntry = BasicSubscriptionEntry | FullSubscriptionEntry;