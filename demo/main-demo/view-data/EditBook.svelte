<script>
  export let book;
  export let onCancel;
</script>

<style>
  input {
    width: 400px;
    border: 1px solid gray;
    border-radius: 5px;
    padding: 3px;
    font-size: 16px;
  }
</style>

<div><span style="font-weight: bold;">Edit</span> {book.title}</div>
<input value={book.title} />
<button>Save</button>
<button on:click={onCancel}>Cancel</button>