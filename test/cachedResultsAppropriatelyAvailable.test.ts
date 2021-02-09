import { setDefaultClient, query, Client } from "../src/index";
import ClientMock from "./clientMock";
import { pause } from "./testUtil";

const LOAD_TASKS = "A";
const LOAD_USERS = "B";
const UPDATE_USER = "M";

let client1: any;
let ComponentToUse: any;
let renders = 0;

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
  setDefaultClient(client1);
  renders = 0;
});

test("Cache object behaves correctly", async () => {
  const { queryState, sync } = query(LOAD_TASKS);
  sync({ a: 12 });

  client1.nextResult = { data: {} };

  expect(typeof client1.getCache(LOAD_TASKS)).toBe("object");
  expect(typeof client1.getCache(LOAD_USERS)).toBe("undefined");

  expect(typeof client1.getCache(LOAD_TASKS).get(client1.getGraphqlQuery({ query: LOAD_TASKS, variables: { a: 12 } }))).toBe("object");
  expect(client1.getCache(LOAD_TASKS).keys.length).toBe(1);
});
