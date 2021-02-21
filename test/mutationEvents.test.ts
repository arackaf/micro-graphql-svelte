import { get } from "svelte/store";

import { setDefaultClient, mutation, query, Cache } from "../src/index";
import ClientMock from "./clientMock";
import { UpdateBookResult } from "./GraphQLTypes";
import { dataPacket, deferred, pause, resolveDeferred } from "./testUtil";

let client1: any;
let client2: any;
let sub: any;

type BookResults = {
  Books: { id: number }[];
};

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

function generateTests(getClient: any, queryProps = () => ({}), mutationProps = () => ({})) {
  test("Mutation listener updates cache X", async () => {
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache }, { updateBook: { Book } }: UpdateBookResult, x: any) => {
          cache.entries.forEach(([key, results]) => {
            if (!(results instanceof Promise) && results.data != null) {
              let CachedBook: any = results.data.Books.find(b => b.id == Book.id);
              CachedBook && Object.assign(CachedBook, Book);
            }
          });
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };

    await sync({ query: "b" });

    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(client.queriesRun).toBe(2); //run for new query args

    sync({ query: "a" });

    expect(client.queriesRun).toBe(2); //still loads from cache
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //loads updated data
  });

  test("Mutation listener updates cache with mutation args - string", async () => {
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "deleteBook",
        run: ({ cache, refresh }, resp, args: any) => {
          cache.entries.forEach(([key, results]) => {
            if (!(results instanceof Promise) && results.data != null) {
              results.data.Books = results.data.Books.filter(b => b.id != args.id);
              refresh();
            }
          });
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };
    await sync({ query: "b" });

    client.nextMutationResult = { deleteBook: { success: true } };
    await get(mutationState).runMutation({ id: 1 });

    expect(client.queriesRun).toBe(2); //run for new query args
    expect(get(queryState).data).toEqual({ Books: [] }); //loads updated data

    await sync({ query: "a" });

    expect(client.queriesRun).toBe(2); //still loads from cache
    expect(get(queryState).data).toEqual({ Books: [{ id: 2, title: "Book 2", author: "Eve" }] }); //loads updated data
  });

  test("Mutation listener updates cache with mutation args - string - component gets new data", async () => {
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "deleteBook",
        run: ({ cache, refresh }, resp, args: any) => {
          cache.entries.forEach(([key, results]) => {
            if (!(results instanceof Promise) && results.data != null) {
              results.data.Books = results.data.Books.filter(b => b.id != args.id);
              refresh();
            }
          });
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //loads updated data

    client.nextMutationResult = { deleteBook: { success: true } };
    await get(mutationState).runMutation({ id: 1 });

    expect(get(queryState).data).toEqual({
      Books: [{ id: 2, title: "Book 2", author: "Eve" }]
    }); //loads updated data
  });

  test("Mutation listener updates cache with mutation args - regex", async () => {
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: /deleteBook/,
        run: ({ cache, refresh }, resp, args: any) => {
          cache.entries.forEach(([key, results]) => {
            if (!(results instanceof Promise) && results.data != null) {
              results.data.Books = results.data.Books.filter(b => b.id != args.id);
              refresh();
            }
          });
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextResult = { data: { Books: [{ id: 1, title: "Book 1", author: "Adam" }] } };
    await sync({ query: "b" });

    client.nextMutationResult = { deleteBook: { success: true } };
    await get(mutationState).runMutation({ id: 1 });

    expect(client.queriesRun).toBe(2); //run for new query args
    expect(get(queryState).data).toEqual({ Books: [] }); //loads updated data

    await sync({ query: "a" });

    expect(client.queriesRun).toBe(2); //still loads from cache
    expect(get(queryState).data).toEqual({ Books: [{ id: 2, title: "Book 2", author: "Eve" }] }); //loads updated data
  });

  test("Mutation listener updates cache then refreshes from cache", async () => {
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, refresh }, { updateBook: { Book } }) => {
          cache.entries.forEach(([key, results]) => {
            if (!(results instanceof Promise) && results.data != null) {
              let newBooks = results.data.Books.map(b => {
                if (b.id == Book.id) {
                  return Object.assign({}, b, Book);
                }
                return b;
              });
              //do this immutable crap just to make sure tests don't accidentally pass because of object references to current props being updated - in real life the component would not be re-rendered, but here's we're verifying the props directly
              let newResults: any = { ...results };
              newResults.data = { ...newResults.data };
              newResults.data.Books = newBooks;
              cache.set(key, newResults);
              refresh();
            }
          });
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(client.queriesRun).toBe(1); //refreshed from cache
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //refreshed with updated data
  });

  test("Mutation listener - soft reset - props right, cache cleared", async () => {
    let componentsCache: any;

    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(componentsCache.entries.length).toBe(0); //cache is cleared!
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //updated data is now there
  });

  test("Mutation listener - soft reset - re-render does not re-fetch", async () => {
    let componentsCache;
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };

    await sync({ query: "a" });

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };

    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //updated data is now there

    sync({ query: "a" });
    await pause();

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //updated data is now there
  });

  test("Mutation listener - soft reset - re-render when you come back", async () => {
    let componentsCache;
    const client1 = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      },
      ...queryProps()
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
    await sync({ query: "a" });

    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "XXXXXX" }
        ]
      }
    };

    client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve New" } } };
    await get(mutationState).runMutation(null);

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve New" }
      ]
    }); //updated data is now there

    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve 2" }
        ]
      }
    };

    await sync({ query: "b" });

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve 2" }
      ]
    });

    client1.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve 3" }
        ]
      }
    };

    await sync({ query: "a" });

    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve 3" }
      ]
    });
  });

  test("Mutation listener - hard reset - props right, cache cleared, client qeried", async () => {
    let componentsCache: any;
    const client = getClient();
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, hardReset }) => {
          componentsCache = cache;
          hardReset();
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    sync({ query: "a" });

    expect(client.queriesRun).toBe(1); //just the one
    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "Eve" }
        ]
      }
    };
    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(componentsCache.entries.length).toBe(1); //just the most recent entry
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //updated data is now there
    expect(client.queriesRun).toBe(2); //run from the hard reset
  });

  test("Mutation listener - new component, re-queries", async () => {
    let componentsCache: any;
    const client = getClient();
    const { queryState, sync } = query<BookResults>("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache, softReset, currentResults }, { updateBook: { Book } }: UpdateBookResult) => {
          componentsCache = cache;
          let CachedBook = currentResults.Books.find(b => b.id == Book.id);
          CachedBook && Object.assign(CachedBook, Book);
          softReset(currentResults);
        }
      },
      ...queryProps()
    });
    const { mutationState } = mutation("someMutation{}", mutationProps());
    sub = queryState.subscribe(() => {});

    client.nextResult = {
      data: {
        Books: [
          { id: 1, title: "Book 1", author: "Adam" },
          { id: 2, title: "Book 2", author: "__WRONG__Eve" }
        ]
      }
    };
    await sync({ query: "a" });

    client.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
    await get(mutationState).runMutation(null);

    expect(componentsCache.entries.length).toBe(0); //cache is cleared!

    expect(client.queriesRun).toBe(1);

    const { sync: sync2 } = query("A", { ...queryProps() });
    await sync2({ query: "a" });
    expect(client.queriesRun).toBe(2);
  });
}
