// port from here https://github.com/gdorsi/musica/blob/636722dd93ed9e99ed720865bec495614a6b254c/libs/automerge-helpers/lib/ClientAccessControlAdapter.ts#L33
import { Message, NetworkAdapter } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";

type ClientAccessControlAdapterOptions = {
  addAuthData(
    message: Message,
    hasChanges: boolean,
  ): Promise<Message & { Authorization?: string }>;
};

export class ClientAccessControlAdapter {
  #options: ClientAccessControlAdapterOptions;

  constructor(options: ClientAccessControlAdapterOptions) {
    this.#options = options;
  }

  wrap(baseAdapter: NetworkAdapter) {
    const originalSend = baseAdapter.send;
    const { addAuthData } = this.#options;

    async function send(message: Message) {
      if (message.type === "sync" || message.type === "request") {
        let hasChanges = false;

        if (message.type === "sync" && message.data) {
          const payload = A.decodeSyncMessage(message.data);

          hasChanges = payload.changes.length > 0;
        }

        originalSend.call(baseAdapter, await addAuthData(message, hasChanges));
      } else {
        originalSend.call(baseAdapter, message);
      }
    }

    baseAdapter.send = send;

    return baseAdapter;
  }
}