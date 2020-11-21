<script>
  import EditBook from "./EditBook";

  export let data;
  let editingBook;
</script>

{#if editingBook}
  <EditBook book={editingBook} onCancel={() => editingBook = null} />
{/if}

<table>
  <thead>
    <tr>
      <th></th>
      <th>Title</th>
      <th>Authors</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#if !data?.loaded}
      <div>Loading...</div>
    {:else}
      {#each data?.data?.allBooks?.Books ?? [] as book}
        <tr>
          <td><img src={book.smallImage} alt="" /></td>
          <td>{book.title}</td>
          <td>{book.authors.join(", ")}</td>
          <td><button on:click={() => editingBook = book}>Edit</button></td>
        </tr>
      {/each}
    {/if}
  </tbody>
</table>