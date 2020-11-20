import App from "./App";

import { Client, setDefaultClient } from "../src/index";

const client = new Client({
  endpoint: "https://mylibrary.io/graphql-public",
  fetchOptions: { mode: "cors" }
});

setDefaultClient(client);

const app = new App({
	target: document.getElementById("home"),
	props: {}
});