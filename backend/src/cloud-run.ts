/* eslint-disable no-new */
import { getSecret } from "./lib/config";
import { SyncServer } from "./sync-server";

const isDev = process.env.NODE_ENV === "development";
const redisUrl = isDev ? process.env.REDIS_URL : await getSecret("REDIS_URL");
process.env.REDIS_URL = redisUrl;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
new SyncServer();
