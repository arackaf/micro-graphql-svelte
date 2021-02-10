import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let client2;
let sub;

const LOAD_TASKS = "A";
const LOAD_USERS = "B";
const UPDATE_USER = "M";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint1");
  setDefaultClient(client1);
});
afterEach(() => {
  sub && sub();
  sub = null;
});

generateTests("client 1", () => client1);
generateTests(
  "client 2",
  () => client2,
  () => ({ client: client2 }),
  () => ({ client: client2 })
);

function generateTests(name, getClient, queryProps = () => ({}), mutationProps = () => ({})) {
  test("client.forceUpdate works - " + name, async () => {
    const client = getClient();
    const { sync, queryState } = query(LOAD_TASKS, { ...queryProps() });
    sub = queryState.subscribe(x => {});

    client.nextResult = { data: { x: 1 } };
    await sync({ assignedTo: 1 });

    expect(get(queryState).data).toEqual({ x: 1 });

    client.nextResult = { data: { x: 2 } };
    const cache = client.getCache(LOAD_TASKS);
    cache.clearCache();
    await client.forceUpdate(LOAD_TASKS);

    expect(get(queryState).data).toEqual({ x: 2 });
  });

  test("force update from client mutation subscription -- string - " + name, async () => {
    var lastResults = null;
    const client = getClient();
    const { queryState, sync } = query(LOAD_TASKS, { ...queryProps() });

    client.subscribeMutation({
      when: "a",
      run: ({ refreshActiveQueries }) => {
        let cache = client.getCache(LOAD_TASKS);

        [...cache._cache.keys()].forEach(k => {
          cache._cache.set(k, { data: { a: 99 } });
        });

        refreshActiveQueries(LOAD_TASKS);
      }
    });
    const { mutationState } = mutation("X", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { a: 2 };
    client.nextResult = { data: { a: 1 } };

    await sync({ assignedTo: null });
    expect(get(queryState).data).toEqual({ a: 1 });

    await get(mutationState).runMutation(null);
    expect(get(queryState).data).toEqual({ a: 99 });
  });

  test("force update from client mutation subscription -- regex - " + name, async () => {
    const client = getClient();
    var lastResults = null;
    const { sync, queryState } = query(LOAD_TASKS, { ...queryProps() });
    sub = queryState.subscribe(x => {});

    const { mutationState } = mutation("X", mutationProps());

    client.subscribeMutation({
      when: /a/,
      run: ({ refreshActiveQueries }) => {
        let cache = client.getCache(LOAD_TASKS);

        [...cache._cache.keys()].forEach(k => {
          cache._cache.set(k, { data: { a: 99 } });
        });

        refreshActiveQueries(LOAD_TASKS);
      }
    });
    client.nextMutationResult = { a: 2 };
    client.nextResult = { data: { a: 1 } };

    await sync({ assignedTo: 1 });
    expect(get(queryState).data).toEqual({ a: 1 });

    await get(mutationState).runMutation(null);
    expect(get(queryState).data).toEqual({ a: 99 });
  });
}
