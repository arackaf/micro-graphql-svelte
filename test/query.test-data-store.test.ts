import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, errorPacket, loadingPacket, pause, rejectDeferred, resolveDeferred } from "./testUtil";

let client1: any;
let resultsState: any;
let queryState: any;
let sync: any;
let sub: any;
let p: any;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
  p = client1.nextResult = deferred();

  ({ resultsState, queryState, sync } = query("A"));
  sub = resultsState.subscribe(() => {});
});

afterEach(() => {
  sub();
});

test("Query resolves and data updated", async () => {
  sync({ a: 1 });
  expect(get(resultsState)).toBe(null);

  await resolveDeferred(p, { data: { tasks: [] } });
  expect(get(resultsState)).toMatchObject({ tasks: [] });
});

test("Query resolves and errors updated", async () => {
  sync({ a: 1 });
  expect(get(resultsState)).toBe(null);

  await resolveDeferred(p, { errors: [{ msg: "a" }] });
  expect(get(resultsState)).toBe(null);
});

test("Error in promise", async () => {
  sync({ a: 1 });
  expect(get(resultsState)).toBe(null);

  await rejectDeferred(p, { message: "Hello" });
  expect(get(resultsState)).toBe(null);
});

test("Out of order promise handled", async () => {
  sync({ a: 1 });

  let resultAfter = (client1.nextResult = deferred());
  sync({ a: 2 });

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });

  await resolveDeferred(p, { data: { tasks: [{ id: -999 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });
});

test("Out of order promise handled 2", async () => {
  sync({ a: 1 });

  let resultAfter = (client1.nextResult = deferred());
  sync({ a: 2 });

  await resolveDeferred(p, { data: { tasks: [{ id: -999 }] } });
  expect(get(resultsState)).toBe(null);

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });
});

test("Cached data handled", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });

  p = client1.nextResult = deferred();
  sync({ a: 2 });

  await resolveDeferred(p, { data: { tasks: [{ id: 2 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 2 }] });

  sync({ a: 1 });
  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });

  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });
  expect(client1.queriesRun).toBe(2);
});

test("Cached data while loading handled", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });

  p = client1.nextResult = deferred();
  sync({ a: 2 });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });

  sync({ a: 1 });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });
});

test("Promise in flight picked up - resolved - handled", async () => {
  sync({ a: 1 });

  await pause();

  let { resultsState: resultsState2, sync: sync2 } = query("A");
  sync2({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });
  expect(get(resultsState2)).toMatchObject({ tasks: [{ id: 1 }] });
});

test("Promise in flight picked up - rejected - and handled", async () => {
  sync({ a: 1 });
  await pause();

  let { resultsState: resultsState2, sync: sync2 } = query("A");
  sync2({ a: 1 });

  await rejectDeferred(p, { message: "Hello" });
  await pause();
  expect(get(resultsState)).toBe(null);
  expect(get(resultsState2)).toBe(null);
});

test("Reload query - see new data", async () => {
  sync({ a: 1 });

  await resolveDeferred(p, { data: { tasks: [{ id: 1 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 1 }] });

  let resultAfter = (client1.nextResult = deferred());
  get<any>(queryState).reload();
  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 2 }] } });
  expect(get(resultsState)).toMatchObject({ tasks: [{ id: 2 }] });
});
