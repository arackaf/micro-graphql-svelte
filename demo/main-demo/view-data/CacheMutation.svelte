<script>
  import { query } from "../../../src/index";
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";
  import { syncQueryToCache, syncCollection } from "./cacheHelpers";

  syncQueryToCache(BOOKS_QUERY, "Book");
  syncQueryToCache(ALL_SUBJECTS_QUERY, "Subject");
      
  // const graphQLClient = getDefaultClient();
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

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY);

  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
