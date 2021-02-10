import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let queryState;
let sync;
let sub;
let p;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
  p = client1.nextResult = deferred();
});

afterEach(() => {
  sub();
});

test("Side effect post-process", async () => {
  let resultAfter = (client1.nextResult = deferred());

  ({ queryState, sync } = query("A", {
    postProcess: (resp: any) => {
      resp.data.tasks[0].id = 2;
    }
  }));
  sub = queryState.subscribe(() => {});

  sync({ a: 1 });

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  await pause();

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 2 }] }));
});

test("Non-side effect post-process", async () => {
  let resultAfter = (client1.nextResult = deferred());

  ({ queryState, sync } = query("A", {
    postProcess: resp => {
      return { data: { tasks: [{ id: 2 }] } };
    }
  }));
  sub = queryState.subscribe(() => {});

  sync({ a: 1 });

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  await pause();

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 2 }] }));
});

test("Non-side effect promise post-process", async () => {
  let resultAfter = (client1.nextResult = deferred());

  ({ queryState, sync } = query("A", {
    postProcess: resp => {
      return Promise.resolve({ data: { tasks: [{ id: 2 }] } });
    }
  }));
  sub = queryState.subscribe(() => {});

  sync({ a: 1 });

  await resolveDeferred(resultAfter, { data: { tasks: [{ id: 1 }] } });
  await pause();

  expect(get(queryState)).toMatchObject(dataPacket({ tasks: [{ id: 2 }] }));
});
