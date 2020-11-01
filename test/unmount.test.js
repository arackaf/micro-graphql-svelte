import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

import { render, fireEvent } from "@testing-library/svelte";
import Comp1 from "./unmountTestComponents/component1";

test("Mutation listener destroys at unmount", async () => {
  let client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  const { unmount, container } = render(Comp1, {});

  client1.nextMutationResult = { updateBook: { Book: { title: "New Title" } } };
  const { mutationState } = mutation("someMutation{}");
  await get(mutationState).runMutation();

  await unmount();

  await client1.processMutation();
  await client1.processMutation();
  await client1.processMutation();
});

/*
test("Mutation listener destroys at unmount", async () => {
  let client1 = new ClientMock("endpoint1");
  let client2 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  let runCount = 0;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent(
    { onMutation: { when: "updateBook", run: () => runCount++ }, client: client2 },
    { client: client2 }
  );
  let { unmount } = render(<Component page={1} />);

  client2.nextMutationResult = { updateBook: { Book: { title: "New Title" } } };
  await mutationProps().runMutation();
  expect(runCount).toBe(1);

  unmount();

  await client2.processMutation();
  await client2.processMutation();
  await client2.processMutation();

  expect(runCount).toBe(1);
});

test("Refresh reference removes at unmount", async () => {
  let client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);

  let runCount = 0;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent({ onMutation: { when: "updateBook", run: () => runCount++ } });
  let { unmount } = render(<Component page={1} />);

  expect(client1.forceListeners.get("A").size).toBe(1);
  
  unmount();
  
  expect(client1.forceListeners.get("A").size).toBe(0);
});

*/
