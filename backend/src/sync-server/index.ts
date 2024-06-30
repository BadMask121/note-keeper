import express from "express";
import { WebSocketServer } from "ws";
import { Repo, RepoConfig } from "@automerge/automerge-repo";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
import os from "os";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { FirebaseStorageAdapter } from "../adapters/FirebaseStorageAdapter";
import { logger } from "../utils/logger";

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
    const storage = new FirebaseStorageAdapter();

    const app = express();
    app.use(express.static("public"));

    const config: RepoConfig = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      network: [new NodeWSServerAdapter(this.#socket)],
      storage,
      /** @ts-expect-error @type {(import("@automerge/automerge-repo").PeerId)}  */
      peerId: `storage-server-${hostname}`,
      // Since this is a server, we don't share generously — meaning we only sync documents they already
      // know about and can ask for by ID.
      // TODO: implement authentication against Redis/Firestore
      sharePolicy: async (peerId, documentId) => {
        try {
          if (!documentId) {
            logger.warn({ peerId }, "SharePolicy: Document ID NOT found");
            return false;
          }
          logger.trace({ peerId, documentId }, "[SHARE_POLICY]: Document found");

          // peer format: `peer-[user#id]:[unique string combination]
          if (peerId.toString().length < 8) {
            logger.error({ peerId }, "SharePolicy: Peer ID invalid");
            return false;
          }

          const userId = peerId.split(":")?.[0]?.split("-")?.[1];
          const isAuthorised = true;
          // const isAuthorised = await verifyDocumentAccess(Number(userId), documentId);
          logger.info({ peerId, userId, documentId, isAuthorised }, "[SHARE POLICY CALLED]::");
          return isAuthorised;
        } catch (err) {
          logger.error({ err }, "Error in share policy");
          return false;
        }
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-new
    new Repo(config);

    app.get("/", (req, res) => {
      res.send(`👍 @automerge/example-sync-server is running`);
    });

    this.#server = app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
      this.#isReady = true;
      this.#readyResolvers.forEach((resolve) => resolve(true));
    });

    this.#server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      this.#socket.handleUpgrade(request, socket, head, (socket) => {
        this.#socket.emit("connection", socket, request);
      });
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
