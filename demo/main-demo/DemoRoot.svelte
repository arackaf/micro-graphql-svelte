<script>
  import { query, mutation } from "../../src/index";
  import { getSearchState, history } from "./util/history-utils";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../savedQueries";
  import { onDestroy } from "svelte";
  import Loading from "./ui/Loading";

  let { page, search } = getSearchState();
  const historySub = history.listen(() => ({ page, search } = getSearchState()));

  const { sync, queryState: booksQueryState } = query(BOOKS_QUERY);
  $: sync({ page, search });

  onDestroy(historySub);
</script>

<div id="app" style="margin: 15px">
  {#if true}
    <Loading />
  {/if}

  <!-- <DemoContent {...{ search, page, isPending, startTransition }} /> -->
</div>
