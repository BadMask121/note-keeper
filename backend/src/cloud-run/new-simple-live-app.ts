import express from "express";
import { WebSocketServer } from "ws";
import { Repo, RepoConfig } from "@automerge/automerge-repo";
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket";
// import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import os from "os";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { FirebaseStorageAdapter } from "../adapters/FirebaseStorageAdapter";

export class Server {
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
      sharePolicy: async () => false,
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
