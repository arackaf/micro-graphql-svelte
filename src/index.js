import Client, { defaultClientManager } from "./client";
import compress from "./compress";
import Cache from "./cache";
import { buildQuery, buildMutation } from "./util";

const { setDefaultClient, getDefaultClient } = defaultClientManager;

export { Client, compress, setDefaultClient, getDefaultClient, buildQuery, buildMutation, Cache };
