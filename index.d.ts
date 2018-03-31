import React, { StatelessComponent, ComponentClass, ClassicComponentClass } from "react";
import Client from "./src/client";

type IReactComponent<P = any> = StatelessComponent<P> | ComponentClass<P> | ClassicComponentClass<P>;

//options you can pass to the query decorator
export interface QueryOptions {
  shouldQueryUpdate?: ({ prevProps: any, props: any, prevQuery: string, query: string, prevVariables: any, variables: any }) => boolean;
  cacheSize?: number = 10;
  client?: Client;
  mapProps?: (props: any) => any;
}

//props that are passed to your decorated query component
export type QueryProps = {
  loading: boolean;
  loaded: boolean;
  data: any;
  error: any;
  reload: () => void;
  clearCache: () => void;
  clearCacheAndReload: () => void;
};

//options you can pass to the mutation decorator
export interface MutationOptions {
  client?: Client;
  mapProps?: (props: any) => any;
}

//props that are passed to your decorated mutation component
export type MutationProps = {
  running: boolean;
  finished: boolean;
  runMutation: (variables: any) => void;
};

//query decorator
export function query(
  queryFn: (componentProps: any) => { query: string; variables: any },
  options: QueryOptions
): <T extends IReactComponent>(input: T) => T;

//mutation decorator
export function mutation(mutation: string, options: MutationOptions): <T extends IReactComponent>(input: T) => T;
