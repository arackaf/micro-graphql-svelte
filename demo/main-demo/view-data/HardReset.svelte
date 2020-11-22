<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import { query } from "../../../src/index";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";
  import { hardResetQuery, bookHardResetQuery, subjectHardResetQuery } from "./hardResetHelpers"

  let searchState = getContext("search_params");

  // let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY, {
  //   onMutation: { when: /(update|create|delete)Books?/, run: ({ hardReset }) => hardReset() }
  // });
  // let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY, {
  //   onMutation: { when: /(update|create|delete)Subjects?/, run: ({ hardReset }) => hardReset() }
  // });

  // let { queryState: booksState, sync: booksSync } = hardResetQuery("Book", BOOKS_QUERY);
  // let { queryState: subjectsState, sync: subjectsSync } = hardResetQuery("Subject", ALL_SUBJECTS_QUERY);

  let { queryState: booksState, sync: booksSync } = bookHardResetQuery(BOOKS_QUERY);
  let { queryState: subjectsState, sync: subjectsSync } = subjectHardResetQuery(ALL_SUBJECTS_QUERY);
  
  
  $: booksSync($searchState);
  $: subjectsSync({});
</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
