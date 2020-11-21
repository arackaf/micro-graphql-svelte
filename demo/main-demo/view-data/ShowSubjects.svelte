<script>
  export let data;
</script>

<ul>
  {#each data?.data?.allSubjects?.Subjects ?? [] as subject}
    <li>{subject.name}</li>
  {/each}
</ul>
