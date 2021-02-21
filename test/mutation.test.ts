import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1: any;
let client2: any;
let ComponentA: any;
let getProps: any;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint2");
  setDefaultClient(client1);
});

test("Mutation function exists", () => {
  const mutationState = get(mutation("A").mutationState);

  expect(typeof mutationState.runMutation).toBe("function");
  expect(mutationState.running).toBe(false);
  expect(mutationState.finished).toBe(false);
});

test("Mutation function calls", () => {
  const mutationState = get(mutation("A").mutationState);
  mutationState.runMutation(null);

  expect(client1.mutationsRun).toBe(1);
});

test("Mutation function calls client override", () => {
  const mutationState = get(mutation("A", { client: client2 }).mutationState);
  mutationState.runMutation(null);

  expect(client1.mutationsRun).toBe(0);
  expect(client2.mutationsRun).toBe(1);
});

test("Mutation function calls twice", () => {
  const mutationState = get(mutation("A").mutationState);
  mutationState.runMutation(null);
  mutationState.runMutation(null);

  expect(client1.mutationsRun).toBe(2);
});

test("Mutation function calls twice - client override", () => {
  const mutationState = get(mutation("A", { client: client2 }).mutationState);
  mutationState.runMutation(null);
  mutationState.runMutation(null);

  expect(client1.mutationsRun).toBe(0);
  expect(client2.mutationsRun).toBe(2);
});
