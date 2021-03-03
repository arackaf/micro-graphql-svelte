import { get } from "svelte/store";

import { setDefaultClient, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

const queryA = "A";
const queryB = "B";

let client1: any;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
  //[a, ComponentA] = getComponentA();
  //[b, c, ComponentB] = getComponentB();
});

//const getComponentA = hookComponentFactory([queryA, (props) => ({ a: props.a })]);
//const getComponentB = hookComponentFactory([queryA, (props) => ({ a: props.a })], [queryB, (props) => ({ b: props.b })]);

test("Basic query fires on mount", () => {
  let { sync } = query(queryA);
  sync({ a: 1 });

  expect(client1.queriesRun).toBe(1);

  expect(client1.queriesRun).toBe(1);
  expect(client1.queryCalls).toEqual([[queryA, { a: 1 }]]);
});

test("Basic query does not re-fire for unrelated prop change", () => {
  let { sync } = query(queryA);
  sync({ a: 1 });

  expect(client1.queriesRun).toBe(1);

  sync({ a: 1 });
  expect(client1.queriesRun).toBe(1);
  expect(client1.queryCalls).toEqual([[queryA, { a: 1 }]]);
});

test("Basic query re-fires for prop change", () => {
  let { sync } = query(queryA);
  sync({ a: 1 });

  expect(client1.queriesRun).toBe(1);

  sync({ a: 2 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryA, { a: 2 }],
  ]);
});

test("Basic query hits cache", () => {
  let { sync } = query(queryA);
  sync({ a: 1 });

  expect(client1.queriesRun).toBe(1);

  sync({ a: 2 });
  sync({ a: 1 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryA, { a: 2 }],
  ]);
});

test("Run two queries", () => {
  let { sync: syncA } = query(queryA);
  syncA({ a: 1 });

  let { sync: syncB } = query(queryB);
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(2);

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
  ]);
});

test("Run two queries second updates", () => {
  let { sync: syncA } = query(queryA);
  syncA({ a: 1 });

  let { sync: syncB } = query(queryB);
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
  ]);

  syncA({ a: 1 });
  syncB({ b: "2a" });

  expect(client1.queriesRun).toBe(3);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
    [queryB, { b: "2a" }],
  ]);
});

test("Run two queries second updates, then hits cache", () => {
  let { sync: syncA } = query(queryA);
  syncA({ a: 1 });

  let { sync: syncB } = query(queryB);
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
  ]);

  syncA({ a: 1 });
  syncB({ b: "2a" });

  expect(client1.queriesRun).toBe(3);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
    [queryB, { b: "2a" }],
  ]);

  syncA({ a: 1 });
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(3);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
    [queryB, { b: "2a" }],
  ]);
});

test("Run two queries with identical prop 'changes'", () => {
  let { sync: syncA } = query(queryA);
  syncA({ a: 1 });

  let { sync: syncB } = query(queryB);
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
  ]);

  syncA({ a: 1 });
  syncB({ b: 2 });

  expect(client1.queriesRun).toBe(2);
  expect(client1.queryCalls).toEqual([
    [queryA, { a: 1 }],
    [queryB, { b: 2 }],
  ]);
});
