import Client from "./client";

export default class MutationManager {
  client: Client;
  mutation: string;
  setState: (newState) => void;
  
  runMutation = variables => {
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
  constructor({ client }, mutation) {
    this.client = client;
    this.mutation = mutation;
  }
}
