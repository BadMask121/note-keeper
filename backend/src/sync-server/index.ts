import { Repo, RepoConfig } from "@automerge/automerge-repo";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
// import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import express from "express";
import { WebSocketServer } from "ws";

import { IncomingMessage } from "http";
import os from "os";
import { Duplex } from "stream";
import { FirebaseStorageAdapter } from "../adapters/FirebaseStorageAdapter";
import dotenv from "dotenv";
import { Redis } from "ioredis";
import { ServerAccessControlAdapter } from "../adapters/ServerAccessControlAdapter";
import { CollaborationCacheDao } from "../dao/CollaborationCacheDao";
import { logger } from "../utils/logger";
import { validateSender } from "./validateSender";

dotenv.config();

/**
 * Sync document changes to connected websocket
 */
export class SyncServer {
  /** @type WebSocketServer */
  #socket: WebSocketServer;

  /** @type ReturnType<import("express").Express["listen"]> */
  #server: ReturnType<import("express").Express["listen"]>;

  /** @type {((value: any) => void)[]} */
  #readyResolvers: Array<(value: boolean | void | PromiseLike<boolean | void>) => void> = [];

  #isReady = false;

  constructor() {
    const hostname = os.hostname();

    this.#socket = new WebSocketServer({ noServer: true });

    const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 3030;
    const app = express();
    const redisClient = new Redis(process.env.REDIS_URL as string);
    const storage = new FirebaseStorageAdapter();
    // const storage = new NodeFSStorageAdapter();
    const collabCache = new CollaborationCacheDao(redisClient);

    app.use(express.static("public"));

    // intercept network for authentication
    const accessControl = new ServerAccessControlAdapter({
      // TODO: implement jwt authentication
      validateDocumentAccess: async (message) => {
        const { senderId, noteId, userId } = message;
        // we need this to return true to allow for creating new documents
        if (!message.documentId) return true;
        if (!senderId || !noteId || !userId) return false;

        // allow edit if sender is a contributor or the document owner and document changed
        const canAndReceieveSendMesssage = await validateSender(collabCache, noteId, userId);
        return canAndReceieveSendMesssage;
      },
    });

    const config: RepoConfig = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      network: [accessControl.wrap(new NodeWSServerAdapter(this.#socket))],
      storage,
      /** @ts-expect-error @type {(import("@automerge/automerge-repo").PeerId)}  */
      peerId: `storage-server-${hostname}`,
      // Since this is a server, we don't share generously — meaning we only sync documents they already
      // know about and can ask for by ID.
      sharePolicy: async () => false,
      // sharePolicy: async (peerId, documentId) => {
      //   try {
      //     if (!documentId) {
      //       logger.warn({ peerId }, "SharePolicy: Document ID NOT found");
      //       return false;
      //     }
      //     logger.trace({ peerId, documentId }, "[SHARE_POLICY]: Document found");

      //     // peerId must be userId
      //     if (peerId.toString().length < 8) {
      //       logger.error({ peerId }, "SharePolicy: Peer ID invalid");
      //       return false;
      //     }

      //     // const isAuthorised = await validateSender(collabCache, noteId, peerId);
      //     logger.info({ peerId, documentId }, "[SHARE POLICY CALLED]::");

      //     return true;
      //   } catch (err) {
      //     logger.error({ err }, "Error in share policy");
      //     return false;
      //   }
      // },
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-new
    new Repo(config);

    app.get("/", (req, res) => {
      res.send(`Sync Server is running 👍`);
    });

    this.#server = app.listen(PORT, () => {
      logger.debug(`Listening on port ${PORT}`);
      this.#isReady = true;
      this.#readyResolvers.forEach((resolve) => resolve(true));
    });

    this.#server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.#socket.handleUpgrade(request, socket, head, (socket) => {
        this.#socket.emit("connection", socket, request);
      });
    });

    this.#server.on("close", () => {
      redisClient.quit();
    });

    /**
     * Listen for termination signal for graceful shutdown
     */
    process.on("SIGTERM", () => {
      // Clean up resources on shutdown
      logger.info("Caught SIGTERM.");
      logger.flush();
      redisClient.quit();
    });
  }

  async ready(): Promise<void | boolean> {
    if (this.#isReady) {
      return true;
    }

    return new Promise((resolve) => {
      this.#readyResolvers.push(resolve);
    });
  }

  close(): void {
    this.#socket.close();
    this.#server.close();
  }
}
