<script>
  import { query } from "../../src/index";

  let runCount = 0;

  let { sync, queryState } = query("A", {
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
