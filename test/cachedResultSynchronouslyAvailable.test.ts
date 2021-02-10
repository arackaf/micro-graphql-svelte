import { get } from "svelte/store";

import { setDefaultClient, query } from "../src/index";
import ClientMock from "./clientMock";
import { pause } from "./testUtil";

const LOAD_TASKS = "A";

let client1: ClientMock;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
});

test("Initial results synchronously available if available", async () => {
  const { queryState: store1, sync: sync1 } = query(LOAD_TASKS);

  client1.nextResult = { data: { x: 1 } };

  sync1({ a: 12 });
  await pause(); // library reads from "network" and awaits result, even though it's mocked here

  expect(get(store1).data).toEqual({ x: 1 });
  expect(client1.queriesRun).toBe(1);

  const { queryState: store2, sync: sync2 } = query(LOAD_TASKS);
  sync2({ a: 12 });

  expect(get(store2).data).toEqual({ x: 1 });
  expect(client1.queriesRun).toBe(1);
});
