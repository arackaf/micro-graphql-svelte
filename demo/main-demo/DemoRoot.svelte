<script>
  import { getSearchState, history, setSearchValues } from "./util/history-utils";
  import { onDestroy, setContext } from "svelte";

  import HardReset from "./view-data/HardReset.svelte";
  import SoftReset from "./view-data/SoftReset.svelte";
  import CacheMutation from "./view-data/CacheMutation.svelte";
  import { writable } from "svelte/store";
  import BasicCodeSandbox from "./BasicCodeSandbox.svelte";

  let inputEl;
  const searchStateStore = writable(getSearchState());
  setContext("search_params", searchStateStore);
  const historySub = history.listen(() => searchStateStore.set(getSearchState()));

  const searchTyped = evt => {
    if (evt.keyCode == 13) {
      setSearchValues({ search: evt.target.value || "", page: void 0 });
    }
  };

  $: ({ search, page } = $searchStateStore);
  $: inputEl && (inputEl.value = search || "");

  onDestroy(historySub);
</script>

<div id="app" style="margin: 15px">
  <button disabled={page == 1} on:click={() => setSearchValues({ page: +page - 1 })}>Prev</button>
  <button on:click={() => setSearchValues({ page: +page + 1 })}>Next</button>
  <input bind:this={inputEl} on:keydown={searchTyped} />

  <div>{JSON.stringify({ page, search })}</div>
  <div>{JSON.stringify($searchStateStore)}</div>

  <hr />

  <BasicCodeSandbox />

  <hr />

  <!-- <HardReset /> -->
  <!-- <SoftReset /> -->
  <CacheMutation />
</div>
