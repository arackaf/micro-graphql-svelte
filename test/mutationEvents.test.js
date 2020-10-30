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
    const client = getClient();
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "updateBook",
        run: ({ cache }, { updateBook: { Book } }) => {
          cache.entries.forEach(([key, results]) => {
            let CachedBook = results.data.Books.find(b => b.id == Book.id);
            CachedBook && Object.assign(CachedBook, Book);
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
    await get(mutationState).runMutation();

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
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "deleteBook",
        run: ({ cache, refresh }, resp, args) => {
          cache.entries.forEach(([key, results]) => {
            results.data.Books = results.data.Books.filter(b => b.id != args.id);
            refresh();
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
    const { queryState, sync } = query("A", {
      onMutation: {
        when: "deleteBook",
        run: ({ cache, refresh }, resp, args) => {
          cache.entries.forEach(([key, results]) => {
            results.data.Books = results.data.Books.filter(b => b.id != args.id);
            refresh();
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
    const { queryState, sync } = query("A", {
      onMutation: {
        when: /deleteBook/,
        run: ({ cache, refresh }, resp, args) => {
          cache.entries.forEach(([key, results]) => {
            results.data.Books = results.data.Books.filter(b => b.id != args.id);
            refresh();
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
    await get(mutationState).runMutation();

    expect(client.queriesRun).toBe(1); //refreshed from cache
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //refreshed with updated data
  });

  test("Mutation listener - soft reset - props right, cache cleared", async () => {
    let componentsCache;

    const client = getClient();
    const { queryState, sync } = query("A", {
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
    await get(mutationState).runMutation();

    expect(componentsCache.entries.length).toBe(0); //cache is cleared!
    expect(get(queryState).data).toEqual({
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "Eve" }
      ]
    }); //updated data is now there
  });
}

/*


test("Mutation listener - soft reset - re-render does not re-fetch", async () => {
  let componentsCache;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent({
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

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }
  };
  let { rerender } = render(<Component query="a" />);
  await pause();

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }
  };

  client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
  await mutationProps().runMutation();

  expect(queryProps().data).toEqual({
    Books: [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve" }
    ]
  }); //updated data is now there

  rerender(<Component query="a" />);
  await pause();

  expect(queryProps().data).toEqual({
    Books: [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve" }
    ]
  }); //updated data is now there
});

test("Mutation listener - soft reset - re-render when you come back", async () => {
  let componentsCache;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent({
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

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }
  };
  let { rerender } = render(<Component query="a" />);
  await pause();

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "XXXXXX" }
      ]
    }
  };

  client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve New" } } };
  await mutationProps().runMutation();
  await pause();

  expect(queryProps().data).toEqual({
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

  rerender(<Component query="b" />);
  await pause();

  expect(queryProps().data).toEqual({
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

  rerender(<Component query="a" />);
  await pause();

  expect(queryProps().data).toEqual({
    Books: [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve 3" }
    ]
  });
});

test("Mutation listener - hard reset - props right, cache cleared, client qeried", async () => {
  let componentsCache;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent({
    onMutation: {
      when: "updateBook",
      run: ({ cache, hardReset, currentResults }) => {
        componentsCache = cache;
        hardReset();
      }
    }
  });

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }
  };
  let { rerender } = render(<Component query="a" />);

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
  await mutationProps().runMutation();
  await pause();

  expect(componentsCache.entries.length).toBe(1); //just the most recent entry
  expect(queryProps().data).toEqual({
    Books: [
      { id: 1, title: "Book 1", author: "Adam" },
      { id: 2, title: "Book 2", author: "Eve" }
    ]
  }); //updated data is now there
  expect(client1.queriesRun).toBe(2); //run from the hard reset
});

test("Mutation listener - new component, re-queries", async () => {
  let componentsCache;
  let [queryProps, mutationProps, Component] = getQueryAndMutationComponent({
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

  client1.nextResult = {
    data: {
      Books: [
        { id: 1, title: "Book 1", author: "Adam" },
        { id: 2, title: "Book 2", author: "__WRONG__Eve" }
      ]
    }
  };
  let { rerender } = render(<Component query="a" />);
  await pause();

  client1.nextMutationResult = { updateBook: { Book: { id: 2, author: "Eve" } } };
  await mutationProps().runMutation();

  expect(componentsCache.entries.length).toBe(0); //cache is cleared!

  expect(client1.queriesRun).toBe(1);

  render(<Component query="a" />);
  await pause();
  expect(client1.queriesRun).toBe(2);
});

*/
