import { get } from "svelte/store";

import { setDefaultClient, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let client2;
const basicQuery = "A";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint2");
  setDefaultClient(client1);
});

test("Default cache size of 10", async () => {
  const { queryState, sync } = query(basicQuery);

  Array.from({ length: 10 }).forEach((x, i) => sync({ page: i + 1 }));

  expect(client1.queriesRun).toBe(10);

  Array.from({ length: 9 }).forEach((x, i) => sync({ page: 10 - i - 1 }));
  expect(client1.queriesRun).toBe(10);
});

test("Reload query", async () => {
  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  expect(client1.queriesRun).toBe(1);

  await pause();

  get(queryState).reload();
  expect(client1.queriesRun).toBe(2);
});

test("Default cache works with reloading", async () => {
  expect(client1.queriesRun).toBe(0);

  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  expect(client1.queriesRun).toBe(1);

  get(queryState).reload();

  Array.from({ length: 9 }).forEach((x, i) => sync({ page: i + 2 }));
  expect(client1.queriesRun).toBe(11);

  get(queryState).reload();

  Array.from({ length: 9 }).forEach((x, i) => sync({ page: 10 - i - 1 }));
  expect(client1.queriesRun).toBe(12);
});

test("Clear cache", async () => {
  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  let cache = client1.getCache(basicQuery);
  expect(cache.entries.length).toBe(1);

  get(queryState).clearCache();
  expect(cache.entries.length).toBe(0);
});

test("Clear cache and reload", async () => {
  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  let cache = client1.getCache(basicQuery);
  expect(cache.entries.length).toBe(1);

  get(queryState).clearCacheAndReload();

  expect(cache.entries.length).toBe(1);
  expect(client1.queriesRun).toBe(2);
});

test("Pick up in-progress query", async () => {
  let p = (client1.nextResult = deferred());

  const { queryState: store1, sync: sync1 } = query(basicQuery);
  sync1({ page: 1 });
  const { queryState: store2, sync: sync2 } = query(basicQuery);
  sync2({ page: 1 });

  await p.resolve({ data: { tasks: [{ id: 9 }] } });

  expect(get(store1)).toMatchObject(dataPacket({ tasks: [{ id: 9 }] }));
  expect(get(store1)).toMatchObject(dataPacket({ tasks: [{ id: 9 }] }));

  expect(client1.queriesRun).toBe(1);
});

test("Cache accessible by query in client", async () => {
  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  let cache = client1.getCache(basicQuery);
  expect(typeof cache).toBe("object");
});

test("Default cache size - verify on cache object retrieved", async () => {
  const { queryState, sync } = query(basicQuery);
  sync({ page: 1 });

  let cache = client1.getCache(basicQuery);

  Array.from({ length: 9 }).forEach((x, i) => {
    sync({ page: i + 2 });
    expect(cache.entries.length).toBe(i + 2);
  });
  expect(cache.entries.length).toBe(10);

  Array.from({ length: 9 }).forEach((x, i) => {
    sync({ page: 10 - i - 1 });
    expect(cache.entries.length).toBe(10);
  });
  expect(cache.entries.length).toBe(10);
});

test("Second component shares the same cache", async () => {
  const { queryState: store1, sync: sync1 } = query(basicQuery);
  sync1({ page: 1 });

  Array.from({ length: 9 }).forEach((x, i) => sync1({ page: i + 2 }));
  expect(client1.queriesRun).toBe(10);

  Array.from({ length: 9 }).forEach((x, i) => sync1({ page: 10 - i - 1 }));
  expect(client1.queriesRun).toBe(10);

  const { queryState: store2, sync: sync2 } = query(basicQuery);
  sync2({ page: 1 });

  Array.from({ length: 9 }).forEach((x, i) => sync2({ page: i + 2 }));
  expect(client1.queriesRun).toBe(10);

  Array.from({ length: 9 }).forEach((x, i) => sync1({ page: i + 2 }));
  expect(client1.queriesRun).toBe(10);
});

test("Default cache size with overridden client", async () => {
  const { queryState, sync } = query(basicQuery, { client: client2 });
  sync({ page: 1 });

  Array.from({ length: 9 }).forEach((x, i) => sync({ page: i + 2 }));
  expect(client2.queriesRun).toBe(10);

  Array.from({ length: 9 }).forEach((x, i) => sync({ page: 10 - i - 1 }));
  expect(client2.queriesRun).toBe(10);
});
