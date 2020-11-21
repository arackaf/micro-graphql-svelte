<script>
  export let data;
</script>

<table>
  <thead>
    <tr>
      <th></th>
      <th>Title</th>
      <th>Authors</th>
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
        </tr>
      {/each}
    {/if}
  </tbody>
</table>