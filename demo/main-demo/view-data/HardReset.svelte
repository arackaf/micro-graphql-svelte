<script>
  import { getContext } from "svelte"
  import { query } from "../../../src/index";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../../savedQueries";

  let searchState = getContext("search_params");
  $: ({ search, page } = $searchState);

</script>

<h1>{ search } - { page }</h1>