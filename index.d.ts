import { Readable } from "svelte/store";

type MutationSubscription = {
  when: string | RegExp;
  run: (payload: MutationHandlerPayload, resp: any, variables: any) => any;
};

type MutationHandlerPayload = {
  currentResults: any;
  cache: Cache;
  softReset: (newResults: any) => void;
  hardReset: () => void;
  refresh: () => void;
};

type QueryPacket = [string, any, any];
type MutationPacket = [string, any];

export type QueryPayload<TResults = any> = {
  loading: boolean;
  loaded: boolean;
  data: TResults;
  error: any;
  currentQuery: string;
  reload: () => void;
  clearCache: () => void;
  clearCacheAndReload: () => void;
};

export type MutationPayload<TResults = any> = {
  running: boolean;
  finished: boolean;
  runMutation: (variables: any) => Promise<TResults>;
};

export class Cache {
  constructor(cacheSize?: number);
  entries: [string, any][];
  get(key: string): any;
  set(key: string, results: any): void;
  delete(key: string): void;
  clearCache(): void;
}

export class Client {
  constructor(options: { endpoint: string; noCaching?: boolean; cacheSize?: number; fetchOptions?: any });
  runQuery(query: string, variables?: any): Promise<any>;
  getGraphqlQuery({ query, variables }: { query: string; variables: any }): string;
  processMutation(mutation: string, variables?: any): Promise<any>;
  runMutation(mutation: string, variables?: any): Promise<any>;
  getCache(query: string): Cache;
  newCacheForQuery(query: string): Cache;
  setCache(query: string, cache: Cache): void;
  subscribeMutation(subscription: any, options?: any): () => void;
  forceUpdate(query: string): void;
}

export const compress: any;
export const setDefaultClient: (client: Client) => void;
export const getDefaultClient: () => Client;

type QueryOptions = {
  onMutation?: MutationSubscription | MutationSubscription[];
  client?: Client;
  cache?: Cache;
};

type MutationOptions = {
  client?: Client;
};

type QueryResults<T> = {
  queryState: Readable<QueryPayload<T>>;
  sync: (variables: any, options: { active: boolean }) => void;
};

export function query<T = any>(query: string, options?: QueryOptions): QueryResults<T>;
export function mutation<T = any>(mutation: string, options?: MutationOptions): { mutationState: Readable<MutationPayload<T>> };
