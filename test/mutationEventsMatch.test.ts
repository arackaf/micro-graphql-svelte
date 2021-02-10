import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1;
let client2;
let sub;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  client2 = new ClientMock("endpoint1");
  setDefaultClient(client1);
});
afterEach(() => {
  sub && sub();
  sub = null;
});

generateTests(() => client1);
generateTests(
  () => client2,
  () => ({ client: client2 }),
  () => ({ client: client2 })
);

function generateTests(getClient, queryProps = () => ({}), mutationProps = () => ({})) {
  test("Mutation listener runs with exact match", async () => {
    const client = getClient();
    let runCount = 0;
    const { queryState, sync } = query("A", {
      onMutation: { when: "updateBook", run: () => runCount++ },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    sync({ page: 1 });

    client.nextMutationResult = { updateBook: { Book: { title: "New Title" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(1);
  });

  test("Mutation listener runs with exact match twice", async () => {
    const client = getClient();
    let runCount = 0;
    let runCount2 = 0;
    const { queryState, sync } = query("A", {
      onMutation: [
        { when: "updateBook", run: () => runCount++ },
        { when: "updateBook", run: () => runCount2++ }
      ],
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { updateBook: { Book: { title: "New Name" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(1);
    expect(runCount2).toBe(1);
  });

  test("Mutation listener runs with regex match", async () => {
    const client = getClient();
    let runCount = 0;
    const { queryState, sync } = query("A", { onMutation: { when: /update/, run: () => runCount++ }, ...queryProps() });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { updateBook: { Book: { title: "New Title" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(1);
  });

  test("Mutation listener runs with regex match twice", async () => {
    const client = getClient();
    let runCount = 0;
    let runCount2 = 0;
    const { queryState, sync } = query("A", {
      onMutation: [
        { when: /book/i, run: () => runCount++ },
        { when: /update/, run: () => runCount2++ }
      ],
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { updateBook: { Book: { title: "New Name" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(1);
    expect(runCount2).toBe(1);
  });

  test("Mutation listener runs either test match", async () => {
    const client = getClient();
    let runCount = 0;
    let runCount2 = 0;
    const { queryState, sync } = query("A", {
      onMutation: [
        { when: "updateBook", run: () => runCount++ },
        { when: /update/, run: () => runCount2++ }
      ],
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { updateBook: { Book: { title: "New Name" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(1);
    expect(runCount2).toBe(1);
  });

  test("Mutation listener misses without match", async () => {
    const client = getClient();
    let runCount = 0;
    const { queryState, sync } = query("A", { onMutation: { when: "updateBook", run: () => runCount++ }, ...queryProps() });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextMutationResult = { updateAuthor: { Author: { name: "New Name" } } };
    await get(mutationState).runMutation(null);

    expect(runCount).toBe(0);
  });
}
