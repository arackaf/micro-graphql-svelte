import ClientMock from "./clientMock";
import { deferred, resolveDeferred } from "./testUtil";

let client1: any;
const basicQuery = "A";

beforeEach(() => {
  client1 = new ClientMock("endpoint1");
});

describe("Preload", () => {
  test("Preload test 1", async () => {
    client1.nextResult = Promise.resolve({});

    expect(client1.queriesRun).toBe(0);
    client1.preload(basicQuery, {});
    expect(client1.queriesRun).toBe(1);
    client1.preload(basicQuery, {});
    expect(client1.queriesRun).toBe(1);
  });
});
