import { logger } from "./utils/logger";
import { SyncServer } from "./sync-server";

/**
 * Listen for termination signal
 */
process.on("SIGTERM", () => {
  // Clean up resources on shutdown
  logger.info("Caught SIGTERM.");
  logger.flush();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _app = new SyncServer();
