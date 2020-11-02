<script>
  import { query, mutation } from "../../src/index";
  import { getSearchState, history } from "./util/history-utils";
  import { BOOKS_QUERY, ALL_SUBJECTS_QUERY } from "../savedQueries";
  import { onDestroy } from "svelte";

  import Loading from "./ui/Loading";
  import FlowItems from "./layout/FlowItems.svelte";

  let { page, search } = getSearchState();
  const historySub = history.listen(() => ({ page, search } = getSearchState()));

  const { sync, queryState: booksQueryState } = query(BOOKS_QUERY);
  $: sync({ page, search });

  onDestroy(historySub);
</script>

<div id="app" style="margin: 15px">
  <div>
    {#if true}
      <Loading />
    {/if}
    <FlowItems style="background-color: blue;">
      <div style="background-color: red; width: 50px;">A</div>
      <div style="background-color: red; width: 50px;">B</div>
      <div style="background-color: red; width: 50px;">C</div>
    </FlowItems>

    <!-- <DemoContent {...{ search, page, isPending, startTransition }} /> -->
  </div>
</div>
