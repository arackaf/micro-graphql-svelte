import { get } from "svelte/store";

import { setDefaultClient, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let client2;
const basicQuery = "A";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint2");
  setDefaultClient(client1);
});

describe("Disable caching", () => {
  test("Explicit cache with size zero", async () => {
    let noCache = new Cache(0);
    let p = (client1.nextResult = deferred());

    const { queryState: store1, sync: sync1 } = query(basicQuery, { cache: noCache });
    const { queryState: store2, sync: sync2 } = query(basicQuery, { cache: noCache });

    sync1({ page: 1 });

    await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });

    sync2({ page: 1 });

    expect(client1.queriesRun).toBe(2);
  });
  test("Explicit cache with size one", async () => {
    let noCache = new Cache(1);
    let p = (client1.nextResult = deferred());

    const { queryState: store1, sync: sync1 } = query(basicQuery, { cache: noCache });
    const { queryState: store2, sync: sync2 } = query(basicQuery, { cache: noCache });

    sync1({ page: 1 });

    await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });

    sync2({ page: 1 });

    expect(client1.queriesRun).toBe(1);
  });

  test("Client with cacheSize zero", async () => {
    let noCacheClient = new ClientMock({ cacheSize: 0 });

    const { queryState: store1, sync: sync1 } = query(basicQuery, { client: noCacheClient });
    const { queryState: store2, sync: sync2 } = query(basicQuery, { client: noCacheClient });

    let p = (client1.nextResult = deferred());

    sync1({ page: 1 });
    await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
    sync2({ page: 1 });

    expect(noCacheClient.queriesRun).toBe(2);
  });
  test("Client with cacheSize one", async () => {
    let noCacheClient = new ClientMock({ cacheSize: 1 });

    const { queryState: store1, sync: sync1 } = query(basicQuery, { client: noCacheClient });
    const { queryState: store2, sync: sync2 } = query(basicQuery, { client: noCacheClient });

    let p = (client1.nextResult = deferred());

    sync1({ page: 1 });
    await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
    sync2({ page: 1 });

    expect(noCacheClient.queriesRun).toBe(1);
  });
});
