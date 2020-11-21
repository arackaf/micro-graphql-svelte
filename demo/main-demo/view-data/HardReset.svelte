<script>
  import { getContext } from "svelte";
  import ShowData from "./ShowData.svelte";
  import ShowBooks from "./ShowBooks.svelte";
  import ShowSubjects from "./ShowSubjects.svelte";
  import { query } from "../../../src/index";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY);
  $: booksSync($searchState);

  let { queryState: subjectsState, sync: subjectsSync } = query(ALL_SUBJECTS_QUERY);
  $: subjectsSync({});

</script>

<ShowData booksData={$booksState} subejctsData={$subjectsState} />
