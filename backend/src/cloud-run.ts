/* eslint-disable no-new */
import dotenv from "dotenv";
import { getRedisInstanceUrl } from "./lib/config";
import { SyncServer } from "./sync-server";

dotenv.config();

const isDev = process.env.NODE_ENV === "development";
const redisUrl = isDev ? process.env.REDIS_URL : await getRedisInstanceUrl();

// we must register REDIS_URL to process env so automerge can use it internally
process.env.REDIS_URL = redisUrl;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
new SyncServer();
