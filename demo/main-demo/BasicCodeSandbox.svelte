<script>
  import { getContext } from "svelte";
  import { query } from "../../src/index";
  import { BOOKS_QUERY } from "../savedQueries";

  let searchState = getContext("search_params");

  let { queryState: booksState, sync: booksSync } = query(BOOKS_QUERY);
  $: booksSync($searchState);

  setTimeout(() => {
    $booksState.reload();
  }, 3000);
</script>

<span> {$booksState.currentQuery} </span>

{#if $booksState.loading}<span>LOADING</span>{/if}

{#if $booksState.loaded}
  <ul>
    {#each $booksState?.data?.allBooks?.Books ?? [] as book}
      <li>{book.title}</li>
    {/each}
  </ul>
{/if}
