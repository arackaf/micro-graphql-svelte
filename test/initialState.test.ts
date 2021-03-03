import { get } from "svelte/store";

import { setDefaultClient, query, Cache } from "../src/index";
import mutation from "../src/mutation";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let ComponentToUse;

const LOAD_TASKS = "A";
const UPDATE_USER = "M";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
});

test("initial mutation state", async () => {
  const mutationState = get(mutation(UPDATE_USER).mutationState);
  expect(typeof mutationState.running).toBe("boolean");
  expect(typeof mutationState.finished).toBe("boolean");
  expect(typeof mutationState.runMutation).toBe("function");
});

test("initial mutation state", async () => {
  const queryState = get(query(LOAD_TASKS).queryState);

  expect(typeof queryState.loading).toEqual("boolean");
  expect(typeof queryState.loaded).toEqual("boolean");
  expect(typeof queryState.data).toEqual("object");
  expect(typeof queryState.error).toEqual("object");
});
