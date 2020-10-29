<script>
  export let val = 0;
</script>

<div>
  <button on:click={() => val++}>Inc</button>
  <span data-testid="sp">{val}</span>
  <button on:click={() => val--}>Dec</button>
</div>
