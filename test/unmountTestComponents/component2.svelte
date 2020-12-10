<script>
  import { query } from "../../src/index";

  export let activate;
  export let deactivate;
  let runCount = 0;

  let { sync, queryState } = query("A", {
    activate,
    deactivate,
    onMutation: {
      when: "updateBook",
      run: () => {
        runCount++;
        if (runCount > 1) {
          throw "Too many updates";
        }
      }
    }
  });
  sync({ a: 1 });

</script>

<div>
  {$queryState}
</div>
