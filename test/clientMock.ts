import ClientBase from "../src/client";
import queryString from "query-string";

export default class Client extends ClientBase {
  queriesRun = 0;
  queryCalls = [];
  mutationsRun = 0;
  mutationCalls = [];
  nextResult: Promise<unknown> | unknown;
  justWait: boolean;
  nextMutationResult: unknown;
  generateResponse: (query: string, variables: unknown) => Promise<unknown>;
  constructor(props) {
    super(props);
    this.reset();
    this.endpoint = "";
  }
  reset = () => {
    this.queriesRun = 0;
    this.queryCalls = [];

    this.mutationsRun = 0;
    this.mutationCalls = [];
  };
  runUri = (uri: string): Promise<unknown> => {
    let parsed = queryString.parse(uri);
    let query = parsed.query;
    let variables = eval("(" + parsed.variables + ")");
    return this.runQuery(query, variables);
  };
  runQuery = (query, variables): Promise<unknown> => {
    if (this.generateResponse) {
      this.nextResult = this.generateResponse(query, variables);
    } else if (this.justWait) {
      return new Promise(() => null);
    }
    this.queriesRun++;
    this.queryCalls.push([query, variables]);
    return this.nextResult || {} as any;
  };
  runMutation = (mutation, variables): Promise<any> => {
    this.mutationsRun++;
    this.mutationCalls.push([mutation, variables]);
    return this.nextMutationResult || {} as any;
  };
}
