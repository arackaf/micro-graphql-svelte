<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { getDefaultClient, query } from "../../../src/index";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";

  const graphQLClient = getDefaultClient();

  // const syncCollection = (current, newResultsLookup) => {
  //   return current.map(item => {
  //     const updatedItem = newResultsLookup.get(item._id);
  //     return updatedItem ? Object.assign({}, item, updatedItem) : item;
  //   });
  // };

  // graphQLClient.subscribeMutation([
  //   {
  //     when: /updateBooks?/,
  //     run: ({ refreshActiveQueries }, resp, variables) => {
  //       const cache = graphQLClient.getCache(BOOKS_QUERY);
  //       const newResults = resp.updateBook ? [resp.updateBook.Book] : resp.updateBooks.Books;
  //       const newResultsLookup = new Map(newResults.map(item => [item._id, item]));

  //       for (let [uri, { data }] of cache.entries) {
  //         data["allBooks"]["Books"] = syncCollection(data["allBooks"]["Books"], newResultsLookup);
  //       }

  //       refreshActiveQueries(BOOKS_QUERY);
  //     }
  //   }
  // ]);

  // graphQLClient.subscribeMutation([
  //   {
  //     when: /updateSubjects?/,
  //     run: ({ refreshActiveQueries }, resp, variables) => {
  //       const cache = graphQLClient.getCache(ALL_SUBJECTS_QUERY);
  //       const newResults = resp.updateSubject ? [resp.updateSubject.Subject] : resp.updateSubjects.Subjects;
  //       const newResultsLookup = new Map(newResults.map(item => [item._id, item]));

  //       for (let [uri, { data }] of cache.entries) {
  //         data["allSubjects"]["Subjects"] = syncCollection(data["allSubjects"]["Subjects"], newResultsLookup);
  //       }

  //       refreshActiveQueries(ALL_SUBJECTS_QUERY);
  //     }
  //   }
  // ]);

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
          const newResults = resp[`update${type}`]
            ? [resp[`update${type}`][type]]
            : resp[`update${type}s`][`${type}s`];
          const newResultsLookup = new Map(newResults.map(item => [item._id, item]));

          for (let [uri, { data }] of cache.entries) {
            data[`all${type}s`][`${type}s`] = syncCollection(
              data[`all${type}s`][`${type}s`],
              newResultsLookup
            );
          }

          refreshActiveQueries(query);
        }
      }
    ]);
  };

  syncQueryToCache(BOOKS_QUERY, "Book");
  syncQueryToCache(ALL_SUBJECTS_QUERY, "Subject");

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY);

  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
