import { render, fireEvent } from "@testing-library/svelte";

import Comp from "./ComponentA";

test("Test A", async () => {
  const { getByTestId, getByText, container } = render(Comp, { val: 5 });

  const span = getByTestId("sp");
  const span2 = container.querySelector("span");
  const inc = getByText("Inc");
  const dec = getByText("Dec");

  expect(typeof span).toBe("object");
  expect(span.textContent).toBe("5");
  
  await fireEvent.click(inc);
  expect(span.textContent).toBe("6");
  
  await fireEvent.click(dec);
  await fireEvent.click(dec);
  await fireEvent.click(dec);

  expect(span.textContent).toBe("3");
  expect(span2.textContent).toBe("3");
});


test("Test B", async () => {
  expect(11).toBe(11);
});


