<script>
  import EditBook from "./EditBook";

  export let data;
  let editingBook;
</script>

{#if editingBook}
  <EditBook book={editingBook} onCancel={() => (editingBook = null)} />
{/if}

{#if data?.loading}
  <h1>Loading...</h1>
{/if}

<table>
  <thead>
    <tr>
      <th />
      <th>Title</th>
      <th>Authors</th>
      <th />
    </tr>
  </thead>
  <tbody>
    {#each data?.data?.allBooks?.Books ?? [] as book}
      <tr>
        <td><img src={book.smallImage} alt="" /></td>
        <td>{book.title}</td>
        <td>{book.authors.join(', ')}</td>
        <td><button on:click={() => (editingBook = book)}>Edit</button></td>
      </tr>
    {/each}
  </tbody>
</table>
