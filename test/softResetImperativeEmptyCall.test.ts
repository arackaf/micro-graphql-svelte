import { get } from "svelte/store";

import { setDefaultClient, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1: any;
let client2: any;
const basicQuery = "A";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint2");
  setDefaultClient(client1);
});

test("Default cache size of 10", async () => {
  const { queryState, sync } = query(basicQuery);

  sync({ page: 1 });
  sync({ page: 2 });
  client1.nextResult = { data: { a: 1 } };
  await sync({ page: 3 });

  expect(get(queryState).data).toEqual({ a: 1 });
  expect(client1.queriesRun).toBe(3);

  get(queryState).softReset(null);
  expect(get(queryState).data).toEqual({ a: 1 });

  sync({ page: 2 });
  sync({ page: 1 });
  expect(client1.queriesRun).toBe(5);
});
