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

generateTests(() => client1);
generateTests(
  () => client2,
  () => ({ client: client2 }),
  () => ({ client: client2 })
);

function generateTests(getClient, queryProps = () => ({}), mutationProps = () => ({})) {
  test("force update from client mutation subscription -- string", async () => {
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
    
    await get(mutationState).runMutation();
    expect(get(queryState).data).toEqual({ a: 99 });
  });

  /*
  test("force update from client mutation subscription -- regex", async () => {
    var lastResults = null;
  
    const ComponentToUse = props => {
      const hasRun = useRef(false);
      const { data } = useQuery(LOAD_TASKS, { assignedTo: props.assignedTo });
      lastResults = data;
  
      const { runMutation } = useMutation("X");
      renders++;
  
      if (!hasRun.current && props.run) {
        hasRun.current = true;
        runMutation({});
      }
  
      return null;
    };
    client1.subscribeMutation({
      when: /a/,
      run: ({ refreshActiveQueries }) => {
        let cache = client1.getCache(LOAD_TASKS);
  
        [...cache._cache.keys()].forEach(k => {
          cache._cache.set(k, { data: { a: 99 } });
        });
  
        refreshActiveQueries(LOAD_TASKS);
      }
    });
    client1.nextMutationResult = { a: 2 };
    client1.nextResult = { data: { a: 1 } };
  
    let { rerender } = render(<ComponentToUse />);
    await pause();
  
    expect(lastResults).toEqual({ a: 1 });
  
    rerender(<ComponentToUse run={true} />);
    await pause();
  
    expect(lastResults).toEqual({ a: 99 });
  });
  */
}
