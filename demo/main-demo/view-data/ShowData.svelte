<script>
  import ShowBooks from "./ShowBooks.svelte";
  import ShowSubjects from "./ShowSubjects.svelte";

  export let booksData;
  export let subejctsData;
</script>

<style>
  .data {
    display: flex;
    flex-direction: row;
  }

  .data > * {
    flex: 1;
  }
</style>

<div class="data">
  <div>
    <ShowBooks data={booksData} />
  </div>
  <div>
    <ShowSubjects data={subejctsData} />
  </div>
</div>

