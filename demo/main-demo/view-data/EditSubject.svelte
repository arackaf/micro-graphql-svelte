<script>
  export let subject;
  export let onCancel;

  import { mutation } from "../../../src/index";
  import { SUBJECT_MUTATION } from "../../savedQueries";

  let inputEl;

  const { mutationState } = mutation(SUBJECT_MUTATION);

  let missingName = false;

  const doSave = () => {
    let newName = inputEl.value;
    missingName = !newName;
    if (missingName) {
      return;
    }
    $mutationState.runMutation({ _id: subject._id, name: newName }).then(() => onCancel());
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

<div><span style="font-weight: bold;">Edit</span> {subject.name}</div>
<input bind:this={inputEl} value={subject.name} />
{#if missingName}<span class="error">Enter a name please</span>{/if}
<button on:click={doSave}>Save</button>
<button on:click={onCancel}>Cancel</button>
{#if $mutationState.running}<span>Saving ...</span>{/if}
