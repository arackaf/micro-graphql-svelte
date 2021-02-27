export type MutationState<TResults = unknown> = {
  running: boolean;
  finished: boolean;
  runMutation: (variables: unknown) => Promise<TResults>;
}