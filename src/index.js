import query from "./query";
import mutation from "./mutation";
import Client, { defaultClientManager } from "./client";
import compress from "./compress";
import Cache from "./cache";

const { setDefaultClient, getDefaultClient } = defaultClientManager;

export { Client, compress, setDefaultClient, getDefaultClient, Cache, query, mutation };
