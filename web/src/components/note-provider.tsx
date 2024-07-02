import { ClientAccessControlAdapter } from "@/adapter/ClientAccessControlAdapter";
import { getSelectedNote, getUser } from "@/lib/storage";
import { AutomergeUrl, NetworkAdapter, PeerId, Repo } from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";

const user = getUser();
const userId = user?.id;

let repo: Repo | null;
if (userId) {
  const accessDataProvider = new ClientAccessControlAdapter({
    // TODO: pass in Jwt authentation token
    async addAuthData(message, hasChanges) {
      if (message.documentId) {
        const note = getSelectedNote();
        return {
          ...message,
          userId,
          noteId: note.id,
        };
      }
      return message;
    },
  });

  const networkAdapters: NetworkAdapter[] = [
    accessDataProvider.wrap(new BrowserWebSocketClientAdapter("ws://localhost:3030")),
    new BroadcastChannelNetworkAdapter(),
  ];

  repo = new Repo({
    network: networkAdapters,
    storage: new IndexedDBStorageAdapter("automerge"),
  });

  // @ts-expect-error -- we put the handle and the repo on window so you can experiment with them from the dev tools
  window.repo = repo
}

export default function NoteProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <RepoContext.Provider value={repo}>
        {children}
      </RepoContext.Provider>
    </div>
  );
}