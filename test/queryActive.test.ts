import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, defaultPacket, deferred, errorPacket, loadingPacket, pause, rejectDeferred, resolveDeferred } from "./testUtil";

let client1: any;
let queryState: any;
let sync: any;
let sub: any;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  ({ queryState, sync } = query("A"));
  sub = queryState.subscribe(() => {});
});

afterEach(() => {
  sub();
});

test("loading props passed", async () => {
  sync({ a: 1 }, { active: false });

  expect(get(queryState)).toMatchObject(defaultPacket);
});

test("Query resolves and data updated", async () => {
  sync({ a: 1 }, { active: null });
  expect(get(queryState)).toMatchObject(defaultPacket);

  let nextResult = (client1.nextResult = deferred());
  await sync({ a: 1 }, { active: true });

  expect(get(queryState)).toMatchObject(loadingPacket);

  await resolveDeferred(nextResult, { data: { tasks: [] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [] }));
});

test("Query resolves and errors updated", async () => {
  let nextResult = (client1.nextResult = deferred());
  sync({ a: 1 }, { active: false });
  expect(get(queryState)).toMatchObject(defaultPacket);

  await sync({ a: 1 }, { active: true });
  expect(get(queryState)).toMatchObject(loadingPacket);

  await resolveDeferred(nextResult, { errors: [{ msg: "a" }] });
  expect(get(queryState)).toMatchObject(errorPacket([{ msg: "a" }]));
});

test("Cached data handled", async () => {
  let nextResult = (client1.nextResult = deferred());
  sync({ a: 1 }, { active: true });

  await resolveDeferred(nextResult, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  nextResult = client1.nextResult = deferred();
  await sync({ a: 1 }, { active: false });
  await pause();

  await resolveDeferred(nextResult, { data: { tasks: [{ id: 2 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  await sync({ a: 1 }, { active: true });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  expect(client1.queriesRun).toBe(1);
});

test("Cached data while loading handled", async () => {
  let nextResult = (client1.nextResult = deferred());
  sync({ a: 1 }, { active: true });

  await resolveDeferred(nextResult, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  nextResult = client1.nextResult = deferred();

  await sync({ a: 2 }, { active: false });

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  await sync({ a: 1 }, { active: false });
  await pause();

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
});
