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
  test("Mutation listener updates cache X", async () => {
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache }, { updateBook: { Book } }) => {
          cache.entries.forEach(([key, results]) => {
            let CachedBook = results.data.Books.find(b => b.id == Book.id);
            CachedBook && Object.assign(CachedBook, Book);
          });
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    await sync({ query: "a" }, { active: true });

    client1.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };

    await sync({ query: "b" }, { active: false });

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(client1.queriesRun).toBe(1); //nothing loaded

    await sync({ query: "a" }, { active: false });

    expect(client1.queriesRun).toBe(1); //nothing's changed
    expect(get(queryState).data).toEqual({
      //nothing's changed
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }); //loads updated data
  });

  test("Mutation listener updates cache with mutation args - string", async () => {
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "deleteBook",
        run: ({ cache, refresh }, resp, args) => {
          cache.entries.forEach(([key, results]) => {
            results.data.Books = results.data.Books.filter(b => b.id != args.id);
            refresh();
          });
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: true });

    client1.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };
    await sync({ query: "b" }, { active: false });

    client1.nextMutationResult = { deleteBook: { success: true } };
    await get(mutationState).runMutation({ id: 1 });

    expect(client1.queriesRun).toBe(1); //nothing changed
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //loads updated data

    await sync({ query: "a" }, { active: false });

    expect(client1.queriesRun).toBe(1); //nothing changed
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //loads updated data
  });

  test("Mutation listener updates cache with mutation args - regex", async () => {
    const { queryState, sync } = query("A", {
      onMutation: {
        when: /deleteBook/,
        run: ({ cache, refresh }, resp, args) => {
          cache.entries.forEach(([key, results]) => {
            results.data.Books = results.data.Books.filter(b => b.id != args.id);
            refresh();
          });
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: true });

    client1.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };
    await sync({ query: "b" }, { active: false });

    client1.nextMutationResult = { deleteBook: { success: true } };
    await get(mutationState).runMutation({ id: 1 });

    expect(client1.queriesRun).toBe(1); // no change
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //no change

    await sync({ query: "a" }, { active: false });

    expect(client1.queriesRun).toBe(1); // no change
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //no change
  });

  test("Mutation listener updates cache then refreshes from cache", async () => {
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, refresh }, { updateBook: { Book } }) => {
          cache.entries.forEach(([key, results]) => {
            let newBooks = results.data.Books.map(b => {
              if (b.id == Book.id) {
                return Object.assign({}, b, Book);
              }
              return b;
            });
            //do this immutable crap just to make sure tests don't accidentally pass because of object references to current props being updated - in real life the component would not be re-rendered, but here's we're verifying the props directly
            let newResults = { ...results };
            newResults.data = { ...newResults.data };
            newResults.data.Books = newBooks;
            cache.set(key, newResults);
            refresh();
          });
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: false });

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();
    await pause();

    expect(client1.queriesRun).toBe(0); //never run
    expect(get(queryState).data).toEqual(null); //refreshed with updated data
  });

  test("Mutation listener updates cache then refreshes from cache 2", async () => {
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, refresh }, { updateBook: { Book } }) => {
          cache.entries.forEach(([key, results]) => {
            let newBooks = results.data.Books.map(b => {
              if (b.id == Book.id) {
                return Object.assign({}, b, Book);
              }
              return b;
            });
            //do this immutable crap just to make sure tests don't accidentally pass because of object references to current props being updated - in real life the component would not be re-rendered, but here's we're verifying the props directly
            let newResults = { ...results };
            newResults.data = { ...newResults.data };
            newResults.data.Books = newBooks;
            cache.set(key, newResults);
            refresh();
          });
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: true });

    await sync({ query: "a" }, { active: false });

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(client1.queriesRun).toBe(1); //run once
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //refreshed with updated data
  });

  test("Mutation listener - soft reset - props right, cache cleared", async () => {
    let componentsCache = null;
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: false });

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(componentsCache).toBe(null); //no change
    expect(get(queryState).data).toEqual(null); //nothing
  });

  test("Mutation listener - soft reset - props right, cache cleared 2", async () => {
    let componentsCache = null;
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };
    await sync({ query: "a" }, { active: true });

    await sync({ query: "a" }, { active: false });

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(componentsCache).toBe(null); //no change
    expect(get(queryState).data).toEqual({ Books: initialBooks }); //nothing
  });

  test("Mutation listener - hard reset - props right, cache cleared, client qeried", async () => {
    let componentsCache = null;
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, hardReset, currentResults }) => {
          componentsCache = cache;
          hardReset();
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };

    await sync({ query: "a" }, { active: false });

    expect(client1.queriesRun).toBe(0); //nothing
    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(componentsCache).toBe(null); //just the initial entry
    expect(get(queryState).data).toEqual(null); //nothing there
    expect(client1.queriesRun).toBe(0); //no run from the hard reset
  });

  test("Mutation listener - hard reset - props right, cache cleared, client qeried 2", async () => {
    let componentsCache = null;
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, hardReset, currentResults }) => {
          componentsCache = cache;
          hardReset();
        }
      }
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    let initialBooks = [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "__WRONG__Eve" }
    ];
    client1.nextResult = {
      data: {
        Books: initialBooks
      }
    };

    await sync({ query: "a" }, { active: true });

    await sync({ query: "a" }, { active: false });

    expect(client1.queriesRun).toBe(1); //just the one
    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation();

    expect(componentsCache).toBe(null); //just the initial entry
    expect(get(queryState).data).toEqual({
      Books: initialBooks
    }); //updated data is not there
    expect(client1.queriesRun).toBe(1); //no run from the hard reset
  });
}
