import { Writable, writable } from "svelte/store";
import Client from "./client";

type MutationState = {
  running: boolean;
  finished: boolean;
  runMutation: (variables: unknown) => Promise<unknown>;
}

type MutationOptions = {
  client: Client;
}

export default class MutationManager {
  client: Client;
  mutation: string;
  setState: (newState: MutationState) => void;
  mutationStore: Writable<MutationState>;
  
  runMutation = (variables: unknown) => {
    this.setState({
      running: true,
      finished: false,
      runMutation: this.runMutation
    });

    return this.client.processMutation(this.mutation, variables).then(resp => {
      this.setState({
        running: false,
        finished: true,
        runMutation: this.runMutation
      });
      return resp;
    });
  };
  static initialState = {
    running: false,
    finished: false
  };
  currentState = {
    ...MutationManager.initialState,
    runMutation: this.runMutation
  };
  updateState = (newState = {}) => {
    Object.assign(this.currentState, newState);
    this.setState(this.currentState);
  };
  constructor({ client }: MutationOptions, mutation: string) {
    this.client = client;
    this.mutation = mutation;

    this.mutationStore = writable(this.currentState, () => () => {
      this.setState = () => {};
    });
  
    this.setState = this.mutationStore.set;
  }
}
