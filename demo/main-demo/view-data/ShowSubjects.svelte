<script>
  import EditSubject from "./EditSubject.svelte";
  export let data;

  let editingSubject;
</script>

{#if editingSubject}
  <EditSubject subject={editingSubject} onCancel={() => (editingSubject = null)} />
{/if}

{#if data?.loading}
  <h1>Loading...</h1>
{/if}

<ul>
  {#each data?.data?.allSubjects?.Subjects ?? [] as subject}
    <li>{subject.name} <button on:click={() => (editingSubject = subject)}>Edit</button></li>
  {/each}
</ul>

<style>
  li {
    list-style-type: none;
    margin-bottom: 10px;
  }
</style>
