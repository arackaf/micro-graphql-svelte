import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, errorPacket, loadingPacket, pause, rejectDeferred, resolveDeferred } from "./testUtil";

let client1;
let queryState;
let sync;
let sub;
let p;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
  p = client1.nextResult = deferred();

  ({ queryState, sync } = query("A"));
  sub = queryState.subscribe(() => {});
});

afterEach(() => {
  sub();
});

test("loading props passed", async () => {
  sync({});
  expect(get(queryState)).toMatchObject(loadingPacket);
});

test("Query resolves and data updated", async () => {
  sync({ a: 1 });
  expect(get(queryState)).toMatchObject(loadingPacket);

  await resolveDeferred(p, { data: { tasks: [] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [] }));
});

test("Query resolves and errors updated", async () => {
  sync({ a: 1 });
  expect(get(queryState)).toMatchObject(loadingPacket);

  await resolveDeferred(p, { errors: [{ msg: "a" }] });
  expect(get(queryState)).toMatchObject(errorPacket([{ msg: "a" }]));
});

test("Error in promise", async () => {
  sync({ a: 1 });
  expect(get(queryState)).toMatchObject(loadingPacket);

  await rejectDeferred(p, { message: "Hello" });
  expect(get(queryState)).toMatchObject(errorPacket({ message: "Hello" }));
});

test("Out of order promise handled", async () => {
  sync({ a: 1 });

  let resultAfter = (client1.nextResult = deferred());
  sync({ a: 2 });

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  await resolveDeferred(p, { data: { tasks: [{ id: -999 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
});

test("Out of order promise handled 2", async () => {
  sync({ a: 1 });

  let resultAfter = (client1.nextResult = deferred());
  sync({ a: 2 });

  await resolveDeferred(p, { data: { tasks: [{ id: -999 }] } });
  expect(get(queryState)).toMatchObject(loadingPacket);

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
});

test("Cached data handled", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  p = client1.nextResult = deferred();
  sync({ a: 2 });

  await resolveDeferred(p, { data: { tasks: [{ id: 2 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 2 }] }));

  sync({ a: 1 });
  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
  expect(client1.queriesRun).toBe(2);
});

test("Cached data while loading handled", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  p = client1.nextResult = deferred();
  sync({ a: 2 });
  expect(get(queryState)).toMatchObject({ ...dataPacket({ tasks: [{ id: 1 }] }), loading: true });

  sync({ a: 1 });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
});

test("Promise in flight picked up - resolved - handled", async () => {
  sync({ a: 1 });

  await pause();

  let { queryState: queryState2, sync: sync2 } = query("A");
  sync2({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
  expect(get(queryState2)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));
});

test("Promise in flight picked up - rejected - and handled", async () => {
  sync({ a: 1 });
  await pause();

  let { queryState: queryState2, sync: sync2 } = query("A");
  sync2({ a: 1 });

  await rejectDeferred(p, { message: "Hello" });
  await pause();
  expect(get(queryState)).toMatchObject(errorPacket({ message: "Hello" }));
  expect(get(queryState2)).toMatchObject(errorPacket({ message: "Hello" }));
});

test("Reload query - see new data", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 1 }] }));

  let resultAfter = (client1.nextResult = deferred());
  get<any>(queryState).reload();
  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 2 }] } });
  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 2 }] }));
});
