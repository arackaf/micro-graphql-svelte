import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

import { render, fireEvent } from "@testing-library/svelte";
import Comp1 from "./unmountTestComponents/component1.svelte";
import Comp2 from "./unmountTestComponents/component2.svelte";
import Comp3 from "./unmountTestComponents/component3.svelte";

test("Mutation listener destroys at unmount", async () => {
  let client1: any = new ClientMock("endpoint1");
  setDefaultClient(client1);

  const { unmount, container } = render(Comp1, {});

  client1.nextMutationResult = { updateBook: { Book: { title: "New Title" } } };
  const { mutationState } = mutation("someMutation{}");
  await get(mutationState).runMutation(null);

  await unmount();

  await client1.processMutation();
  await client1.processMutation();
  await client1.processMutation();
});

test("Refresh reference removes at unmount", async () => {
  let client1: any = new ClientMock("endpoint1");
  setDefaultClient(client1);

  let runCount = 0;

  const { unmount } = render(Comp1, {});
  await pause();

  expect(client1.forceListeners.get("A").size).toBe(1);

  unmount();

  expect(client1.forceListeners.get("A").size).toBe(0);
});

test("Activation works unmount", async () => {
  let client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  let activateCount = 0;
  let deActivateCount = 0;

  const activate = () => activateCount++;
  const deactivate = () => deActivateCount++;

  expect(activateCount).toBe(0);
  expect(deActivateCount).toBe(0);

  const { unmount } = render(Comp2, { activate, deactivate });

  expect(activateCount).toBe(1);
  expect(deActivateCount).toBe(0);

  await unmount();

  expect(activateCount).toBe(1);
  expect(deActivateCount).toBe(1);

  const { unmount: unmount2 } = render(Comp2, { activate, deactivate });

  expect(activateCount).toBe(2);
  expect(deActivateCount).toBe(1);

  await unmount2();

  expect(activateCount).toBe(2);
  expect(deActivateCount).toBe(2);
});

test("Activation works unmount - 2", async () => {
  let client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  let activateCount = 0;
  let deActivateCount = 0;

  const activate = () => activateCount++;
  const deactivate = () => deActivateCount++;

  expect(activateCount).toBe(0);
  expect(deActivateCount).toBe(0);

  let { sync, queryState } = query("A", {
    activate,
    deactivate
  });

  const { unmount } = render(Comp3, { queryState });

  expect(activateCount).toBe(1);
  expect(deActivateCount).toBe(0);

  await unmount();

  expect(activateCount).toBe(1);
  expect(deActivateCount).toBe(1);

  const { unmount: unmount2 } = render(Comp3, { queryState });

  expect(activateCount).toBe(2);
  expect(deActivateCount).toBe(1);

  await unmount2();

  expect(activateCount).toBe(2);
  expect(deActivateCount).toBe(2);
});
