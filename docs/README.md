## Installation

```javascript
npm i micro-graphql-svelte --save
```

**Note** - this project ships standard, modern JavaScript (ES6, object spread, etc) that works in all evergreen browsers. If you need to support ES5 environments like IE11, just add an alias pointing to the ES5 build in your webpack config like so

```javascript
alias: {
  "micro-graphql-svelte": "node_modules/micro-graphql-svelte/index-es5.js"
},
```

(`alias` goes under the `resolve` section in webpack.config.js)

## Creating a client

Before you do anything, you'll need to create a client.

```javascript
import { Client, setDefaultClient } from "micro-graphql-svelte";

const client = new Client({
  endpoint: "/graphql",
  fetchOptions: { credentials: "include" }
});

setDefaultClient(client);
```

Now that client will be used by default, everywhere, unless you manually pass in a different client to a query's options, as discussed below.

### Accessing the client

To access the default client anywhere in your codebase, you can use the `getDefaultClient` method.

```javascript
import { getDefaultClient } from "micro-graphql-svelte";

const client = getDefaultClient();
```

### Client options

<!-- prettier-ignore -->
| Option  | Description |
| -------| ----------- |
| `endpoint` | URL for your GraphQL endpoint |
| `fetchOptions`  | Options to send along with all fetches|
| `cacheSize`  | Default cache size to use for all caches created by this client, as needed, for all queries it processes|

### Client api

<!-- prettier-ignore -->
| Option  | Description |
| -------| ----------- |
| `runQuery(query: String, variables?: Object)` | Manually run this GraphQL query |
| `runMutation(mutation: String, variables?: Object)`  | Manually run this GraphQL mutation|
| `forceUpdate(query)`  | Manually update any components rendering that query. This is useful if you (dangerously) update a query's cache, as discussed in the caching section, below|

## Running queries and mutations

### Preloading queries

Regardless of whether you're using Suspense, it's a good idea to preload a query as soon as you know it'll be requested downstream by a (possibly lazy loaded) component. To preload a query, just call the `preload` method on the client, and pass a query, and any args you might have.

```javascript
import { getDefaultClient } from "micro-graphql-svelte";

const client = getDefaultClient();
client.preload(YourQuery, variables);
```

### Queries and Mutations

This project exports a `query`, and `mutation` function.

### Queries

```js
let { queryState, sync } = query(YOUR_QUERY);
$: booksSync($searchState);
```

query takes the following arguments

<!-- prettier-ignore -->
| Arg | Description | 
| -------| ----------- |
| `query: string` | The query text |
| `options: object`  | The query's options (optional) |

The options argument, if supplied, can contain these properties

<!-- prettier-ignore -->
| Option  | Description |
| -------| ----------- |
| `onMutation` | A map of mutations, along with handlers. This is how you update your cached results after mutations, and is explained more fully below |
| `client`  | Manually pass in a client to be used for this query, which will override the default client|

Be sure to use the `compress` tag to remove un-needed whitespace from your query text, since it will be sent via HTTP GET—for more information, see [here](./compress). An even better option would be to use my [persisted queries helper](https://github.com/arackaf/generic-persistgraphql). This not only removes the entire query text from your network requests altogether, but also from your bundled code.

`query` returns an object with a `queryState` property, which will be a store with your query's current results, as well as a `sync` function, which you can call anytime to update the query's current variables. Your query will not actually run until you've called sync. If your query does not need any variables, then just call it immediately with an empty object.

### Query results

The `queryState` store returned from your `query()` call has the following properties.

<!-- prettier-ignore -->
| Props | Description |
| ----- | ----------- |
|`loading`|Fetch is executing for your query|
|`loaded`|Fetch has finished executing for your query|
|`data`|If the last fetch finished successfully, this will contain the data returned, else null|
|`currentQuery`|The query that was run, which produced the current results. This updates synchronously with updates to `data`, so you can use changes here as an easy way to subscribe to query result changes. This will not have a value until there are results passed to `data`. In other words, changes to `loading` do not affect this value|
|`error`|If the last fetch did not finish successfully, this will contain the errors that were returned, else `null`|
|`reload`|`function`: Manually re-fetches the current query|
|`clearCache`|`function`: Clear the cache for this query|
| `softReset` |`function`: Clears the cache, but does **not** re-issue any queries. It can optionally take an argument of new, updated results, which will replace the current `data` props |
| `hardReset` |`function`: Clears the cache, and re-load the current query from the network|

### Mutations

```js
const { mutationState } = mutation(YOUR_MUTATION);
```

The mutation function takes the following arguments. 

<!-- prettier-ignore -->
| Arg         | Description  |
| ------------- | --------- |
| `mutation: string`     | Mutation text |
| `options: object`    | Mutation options (optional) |

The options argument, if supplied, can contain this property

<!-- prettier-ignore -->
| Option        | Description  |
| ------------- | --------- |
| `client`     | Override the client used |

### Mutation results

`mutation` returns a store with the following properties.

<!-- prettier-ignore -->
| Option        | Description  |
| ------------- | --------- |
| `running`     | Mutation is executing |
| `finished`    | Mutation has finished executing|
| `runMutation` | A function you can call when you want to run your mutation. Pass it your variables |

## Caching

The client object maintains a cache of each query it comes across when processing your components. The cache is LRU with a default size of 10 and, again, stored at the level of each specific query, not the GraphQL type. As your instances mount and unmount, and update, the cache will be checked for existing results to matching queries.

### Cache object

You can import the `Cache` class like this

```javascript
import { Cache } from "micro-graphql-svelte";
```

When instantiating a new cache object, you can optionally pass in a cache size.

```javascript
let cache = new Cache(15);
```

#### Cache api

The cache object has the following properties and methods

<!-- prettier-ignore -->
| Member | Description  |
| ----- | --------- |
| `get entries()`   | An array of the current entries. Each entry is an array of length 2, of the form `[key, value]`. The cache entry key is the actual GraphQL url query that was run. If you'd like to inspect it, see the variables that were sent, etc, just use your favorite url parsing utility, like `url-parse`. And of course the cache value itself is whatever the server sent back for that query. If the query is still pending, then the entry will be a promise for that request. |
| `get(key)` | Gets the cache entry for a particular key      |
| `set(key, value)` | Sets the cache entry for a particular key  |
| `delete(key)`     | Deletes the cache entry for a particular key |
| `clearCache()`    | Clears all entries from the cache |

### Cache invalidation

The onMutation option that query options take is an object, or array of objects, of the form `{ when: string|regularExpression, run: function }`

`when` is a string or regular expression that's tested against each result of any mutations that finish. If the mutation has any result set names that match, then `run` will be called with three arguments: an object with these properties, described below, `{ softReset, currentResults, hardReset, cache, refresh }`; the entire mutation result; and the mutation's `variables` object.

<!-- prettier-ignore -->
| Arg  | Description  |
| ---| -------- |
| `softReset` | Clears the cache, but does **not** re-issue any queries. It can optionally take an argument of new, updated results, which will replace the current `data` props |
| `currentResults` | The current results that are passed as your `data` prop |
| `hardReset` | Clears the cache, and re-load the current query from the network|
| `cache`  | The actual cache object. You can enumerate its entries, and update whatever you need.|
| `refresh`   | Refreshes the current query, from cache if present. You'll likely want to call this after modifying the cache.  |

Many use cases follow. They're based on a hypothetical book tracking website.

The code below uses a publicly available GraphQL endpoint created by my [mongo-graphql-starter project](https://github.com/arackaf/mongo-graphql-starter). You can run these examples from the demo folder of this repository. Just run `npm i` then run the `npm run demo` and `npm starte` scripts in separate terminals, and open `http://localhost:8082/`

#### Hard Reset: Reload the query after any relevant mutation

Let's say that whenever a mutation happens, we want to immediately invalidate any related queries' caches, and reload the current queries from the network. We understand that this may cause a book that we just edited to immediately disappear from our current search results, since it no longer matches our search criteria, but that's what we want.

The hard reload method that's passed makes this easy. Let's see how to use this in a (contrived) component that queries, and displays some books and subjects.

```svelte
<script>
  import { query } from "micro-graphql-svelte";
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY, {
    onMutation: { when: /(update|create|delete)Books?/, run: ({ hardReset }) => hardReset() }
  });
  let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY, {
    onMutation: { when: /(update|create|delete)Subjects?/, run: ({ hardReset }) => hardReset() }
  });  
  
  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
```

Here we specify a regex matching every kind of book, or subject mutation, and upon completion, we just clear the cache, and reload by calling `hardReset()`. It's hard not to be at least a littler dissatisfied with this solution; the boilerplate is non-trivial. 

Assuming our GraphQL operations have a consistent naming structure—and they should, and in this case do—then some pretty obvious patterns emerge. We can write some basic helpers to remove some of this boilerplate.

```javascript
//hardResetHelpers.js
import { query } from "micro-graphql-svelte";

export const hardResetQuery = (type, queryToRun, options = {}) =>
  query(queryToRun, {
    ...options,
    onMutation: {
      when: new RegExp(`(update|create|delete)${type}s?`),
      run: ({ hardReset }) => hardReset()
    }
  });
```

which we _could_ use like this

```svelte
<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";
  import { hardResetQuery } from "./hardResetHelpers"

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = hardResetQuery("Book", BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = hardResetQuery("Subject", ALL_SUBJECTS_QUERY);  
  
  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
```

but really, why not just go the extra mile and make wrappers for our various types, like so

```javascript
//hardResetHelpers.js
import { query } from "micro-graphql-svelte";

export const hardResetQuery = (type, queryToRun, options = {}) =>
  query(queryToRun, {
    ...options,
    onMutation: {
      when: new RegExp(`(update|create|delete)${type}s?`),
      run: ({ hardReset }) => hardReset()
    }
  });

export const bookHardResetQuery = (...args) => hardResetQuery("Book", ...args);
export const subjectHardResetQuery = (...args) => hardResetQuery("Subject", ...args);
```

which trims the code to just this

```svelte
<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";
  import { bookHardResetQuery, subjectHardResetQuery } from "./hardResetHelpers";

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = bookHardResetQuery(BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = subjectHardResetQuery(ALL_SUBJECTS_QUERY);

  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
```

#### Soft Reset: Update current results, but clear the cache

Let's say that, upon successful mutation, you want to update your current results based on what was changed, clear all other cache entries, including the existing one, but **not** run any network requests. So if you're currently searching for an author of "Dumas Malone," but one of the current results was clearly written by Shelby Foote, and you click the book's edit button and fix it, you want that book to now show the updated values, but stay in the current results, since re-loading the current query and having the book just vanish is bad UX in your opinion.

Here's the same books component as above, but with our new cache strategy

```javascript
export default props => {
  const [page, setPage] = useState(1);
  const { data, loading } = useQuery(
    BOOKS_QUERY,
    { page },
    {
      onMutation: {
        when: /updateBooks?/,
        run: ({ softReset, currentResults }, resp) => {
          const updatedBooks = resp.updateBooks?.Books ?? [resp.updateBook.Book];
          updatedBooks.forEach(book => {
            let CachedBook = currentResults.allBooks.Books.find(b => b._id == book._id);
            CachedBook && Object.assign(CachedBook, book);
          });
          softReset(currentResults);
        }
      }
    }
  );

  const books = data?.allBooks?.Books ?? [];

  return (
    <div>
      <div>
        {books.map(book => (
          <div key={book._id}>{book.title}</div>
        ))}
      </div>
      <RenderPaging page={page} setPage={setPage} />
      {loading ? <span>Loading ...</span> : null}
    </div>
  );
};
```

Whenever a mutation comes back with `updateBook` or `updateBooks` results, we manually update our current results, then call `softReset`, which clears our cache, including the current cache result; so if you page up, then come back down to where you were, a **new** network request will be run, and your edited books may no longer be there, if they no longer match the search results.

Obviously this is more boilerplate than we'd every want to write in practice, so let's tuck it behind a custom hook, like we did before.

```javascript
import { useQuery } from "micro-graphql-svelte";

export const useSoftResetQuery = (type, query, variables, options = {}) =>
  useQuery(query, variables, {
    ...options,
    onMutation: {
      when: new RegExp(`update${type}s?`),
      run: ({ softReset, currentResults }, resp) => {
        const updatedItems = resp[`update${type}s`]?.[`${type}s`] ?? [resp[`update${type}`][type]];
        updatedItems.forEach(updatedItem => {
          let CachedItem = currentResults[`all${type}s`][`${type}s`].find(item => item._id == updatedItem._id);
          CachedItem && Object.assign(CachedItem, updatedItem);
        });
        softReset(currentResults);
      }
    },
  });

export const useBookSoftResetQuery = (...args) => useSoftResetQuery("Book", ...args);
export const useSubjectSoftResetQuery = (...args) => useSoftResetQuery("Subject", ...args);
```

which we can use to eliminate that boilerplate 


```javascript
export default props => {
  const [page, setPage] = useState(1);
  const { data, loading } = useBookSoftResetQuery(BOOKS_QUERY, { page });

  const books = data?.allBooks?.Books ?? [];

  return (
    <div>
      <div>
        {books.map(book => (
          <div key={book._id}>{book.title}</div>
        ))}
      </div>
      <RenderPaging page={page} setPage={setPage} />
      {loading ? <span>Loading ...</span> : null}
    </div>
  );
};
```

or similarly for our subjects component 

```javascript
export default props => {
  const [page, setPage] = useState(1);
  const { data, loading } = useSubjectSoftResetQuery(SUBJECTS_QUERY, { page });

  const subjects = data?.allSubjects?.Subjects ?? [];

  return (
    <div>
      <div>
        {subjects.map(subject => (
          <div key={subject._id}>{subject.name}</div>
        ))}
      </div>
      <RenderPaging page={page} setPage={setPage} />
      {loading ? <span>Loading ...</span> : null}
    </div>
  );
};
```

#### Use Case 3: Manually update all affected cache entries

Let's say you want to intercept mutation results, and manually update your cache. This is difficult to get right, so be careful. You'll likely only want to do this with data that are not searched or filtered.

For this, we can call the `subscribeMutation` method right on the client object, and pass in the same `when` test, and `run` callback as before. Except now the `run` callback will receive a `refreshActiveQueries` callback, which we can use to force any hooks showing data from a particular query to update itself from the now-updated cache.

The manual solution might look something like this

```javascript
const graphQLClient = getDefaultClient();

const syncCollection = (current, newResultsLookup) => {
  return current.map(item => {
    const updatedItem = newResultsLookup.get(item._id);
    return updatedItem ? Object.assign({}, item, updatedItem) : item;
  });
};

graphQLClient.subscribeMutation([
  {
    when: /updateBooks?/,
    run: ({ refreshActiveQueries }, resp, variables) => {
      const cache = graphQLClient.getCache(BOOKS_QUERY);
      const newResults = resp.updateBook ? [resp.updateBook.Book] : resp.updateBooks.Books;
      const newResultsLookup = new Map(newResults.map(item => [item._id, item]));

      for (let [uri, { data }] of cache.entries) {
        data["allBooks"]["Books"] = syncCollection(data["allBooks"]["Books"], newResultsLookup);
      }

      refreshActiveQueries(BOOKS_QUERY);
    }
  }
]);

syncQueryToCache(BOOKS_QUERY, "Book");

export default props => {
  const [page, setPage] = useState(1);
  const { data, loading } = useQuery(BOOKS_QUERY, { page });

  const books = data?.allBooks?.Books ?? [];

  return (
    <div>
      <div>
        {books.map(book => (
          <div key={book._id}>{book.title}</div>
        ))}
      </div>
      <RenderPaging page={page} setPage={setPage} />
      {loading ? <span>Loading ...</span> : null}
    </div>
  );
};
```

It's a lot of code, but as always the idea is that you'd wrap it all into some re-usable helpers, like this

```javascript
import { getDefaultClient } from "micro-graphql-svelte";

const graphQLClient = getDefaultClient();

const syncCollection = (current, newResultsLookup) => {
  return current.map(item => {
    const updatedItem = newResultsLookup.get(item._id);
    return updatedItem ? Object.assign({}, item, updatedItem) : item;
  });
};

export const syncQueryToCache = (query, type) => {
  graphQLClient.subscribeMutation([
    {
      when: new RegExp(`update${type}s?`),
      run: ({ refreshActiveQueries }, resp, variables) => {
        const cache = graphQLClient.getCache(query);
        const newResults = resp[`update${type}`] ? [resp[`update${type}`][type]] : resp[`update${type}s`][`${type}s`];
        const newResultsLookup = new Map(newResults.map(item => [item._id, item]));

        for (let [uri, { data }] of cache.entries) {
          data[`all${type}s`][`${type}s`] = syncCollection(data[`all${type}s`][`${type}s`], newResultsLookup);
        }

        refreshActiveQueries(query);
      }
    }
  ]);
};
```
which cuts the usage code to just this

```javascript
syncQueryToCache(BOOKS_QUERY, "Book");

export default props => {
  const [page, setPage] = useState(1);
  const { data, loading } = useQuery(BOOKS_QUERY, { page });

  const books = data?.allBooks?.Books ?? [];

  return (
    <div>
      <div>
        {books.map(book => (
          <div key={book._id}>{book.title}</div>
        ))}
      </div>
      <RenderPaging page={page} setPage={setPage} />
      {loading ? <span>Loading ...</span> : null}
    </div>
  );
};
```

#### A note on cache management code

There's always a risk with "micro" libraries resulting in more application code overall, since they do too little. Remember, this library passes on doing client-side cache updating not so that it can artificially shrink it's bundle size, but rather because this is a problem that's all but impossible to do in an automated way that covers all use cases (see the repo's main README for an explanation).

Assuming your GraphQL endpoint has a consistent naming scheme, it should be straightforward to hand-craft a caching strategy that's tailored to your app's needs.

## Manually running queries or mutations

It's entirely possible some pieces of data may need to be loaded from, and stored in your state manager, rather than fetched via a component's lifecycle; this is easily accommodated. The `useQuery` hook runs queries and mutations through the client object you're already setting via `setDefaultClient`. You can use its api to interact with your GraphQL endpoint manually if you need.

### Client api

- `runQuery(query: String, variables?: Object)`
- `runMutation(mutation: String, variables?: Object)`

## Use in old browsers

By default this library ships modern, standard JavaScript, which should work in all decent browsers. If you have to support older browsers like IE, then just add the following alias to your webpack's resolve section

```javascript
  resolve: {
    alias: {
      "micro-graphql-svelte": "node_modules/micro-graphql-svelte/index-es5.js"
    },
    modules: [path.resolve("./"), path.resolve("./node_modules")]
  }
```
