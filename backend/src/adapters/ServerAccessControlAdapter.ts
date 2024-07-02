import {
  Message,
  NetworkAdapter,
  NetworkAdapterEvents,
  RepoMessage,
} from "@automerge/automerge-repo";
import * as A from "@automerge/automerge";

interface ServerAccessControlAdapterOptions {
  validateDocumentAccess(
    message: Message & { userId?: string; noteId?: string },
    hasChanges: boolean
  ): Promise<boolean>;
}

export class ServerAccessControlAdapter {
  #options: ServerAccessControlAdapterOptions;

  constructor(options: ServerAccessControlAdapterOptions) {
    this.#options = options;
  }

  wrap(baseAdapter: NetworkAdapter): NetworkAdapter {
    const originalEmit = baseAdapter.emit;

    const { validateDocumentAccess } = this.#options;

    function emit(event: keyof NetworkAdapterEvents, message: RepoMessage) {
      if (event === "message") {
        if (message.type === "sync" || message.type === "request") {
          let hasChanges = false;

          if (message.type === "sync" && message.data) {
            const payload = A.decodeSyncMessage(message.data);

            hasChanges = payload.changes.length > 0;
          }

          validateDocumentAccess(message, hasChanges).then((valid) => {
            if (valid) {
              originalEmit.call(baseAdapter, event, message);
            }
          });
          return;
        }
      }

      return originalEmit.call(baseAdapter, event, message);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line no-param-reassign
    baseAdapter.emit = emit;

    return baseAdapter;
  }
}
