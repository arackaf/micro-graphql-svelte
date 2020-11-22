<script>
  export let book;
  export let onCancel;

  import { mutation } from "../../../src/index";
  import { MODIFY_BOOK_TITLE } from "../../savedQueries";

  let inputEl;

  const { mutationState } = mutation(MODIFY_BOOK_TITLE);

  let missingTitle = false;
  
  const doSave = () => {
    let newTitle = inputEl.value;
    missingTitle = !newTitle;
    if (missingTitle) {
      return;
    }
    $mutationState.runMutation({ _id: book._id, title: newTitle });
  };
</script>

<style>
  input {
    width: 400px;
    border: 1px solid gray;
    border-radius: 5px;
    padding: 3px;
    font-size: 16px;
  }

  .error {
    color: red;
  }
</style>

<div><span style="font-weight: bold;">Edit</span> {book.title}</div>
<input bind:this={inputEl} value={book.title} />
{#if missingTitle}<span class="error">Enter a title please</span>{/if}
<button on:click={doSave}>Save</button>
<button on:click={onCancel}>Cancel</button>
