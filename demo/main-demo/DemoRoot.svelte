<script>
  import { query, mutation } from "../../src/index";
  import { getSearchState, history, setSearchValues } from "./util/history-utils";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../savedQueries";
  import { onDestroy } from "svelte";

  let inputEl;
  let { page, search } = getSearchState();
  const historySub = history.listen(() => ({ page, search } = getSearchState()));

  const { sync, queryState: booksQueryState } = query(BOOKS_QUERY);
  $: {
    sync({ page, search });
    inputEl && (inputEl.value = search || "");
  }


  onDestroy(historySub);

  const searchTyped = evt => {
    if (evt.keyCode == 13) {
      setSearchValues({ search: evt.target.value });
    }
  };


</script>

<div id="app" style="margin: 15px">
  <button disabled={page == 1} on:click={() => setSearchValues({ page: +page - 1 })}>Prev</button>
  <button on:click={() => setSearchValues({ page: +page + 1 })}>Next</button>
  <input bind:this={inputEl} on:keydown={searchTyped} />

  <div>{JSON.stringify({ page, search })}</div>
</div>
