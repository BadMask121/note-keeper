import { useAppParams } from "@/hooks/useAppParams";
import { useGet } from "@/hooks/useFetch";
import { getUser, setSelectedNote } from "@/lib/storage";
import { ContributorsResponse, NoteResponse } from "@/lib/types";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useEffect, useMemo } from "react";
import { InviteAvatar, InviteUser } from "./invite-user";
import { NoteEditor } from "./note-editor";

export default function NoteContent() {
  const { selectedId } = useAppParams();
  const user = getUser();
  const { data: contributorResponse, isLoading: isFetchingCollaboration } = useGet<ContributorsResponse>(`/note/${selectedId}/invite`);
  const { data, isLoading } = useGet<NoteResponse>(selectedId ? `/note/${selectedId}` : null);

  const note = useMemo(() => data?.result, [data]);

  useEffect(() => {
    if (note) {
      setSelectedNote(note);
    }
  }, [note, selectedId]);

  const docUrl = useMemo(() => {
    console.log(note, "notee")
    if (note?.autoMergeDocId) {
      return `automerge:${note.autoMergeDocId}` as AutomergeUrl;
    }
    return null
  }, [note]);

  const collabs = useMemo(() => {
    const cols = contributorResponse?.result || []
    console.log(cols, contributorResponse);
    return cols
  }, [contributorResponse])

  if (!selectedId) {
    return <p>Open a note to view</p>
  };

  if (isLoading) {
    return <p>Loading document...</p>
  };

  console.log(docUrl, "url");
  if (!docUrl || !isValidAutomergeUrl(docUrl)) {
    return <p>No document found</p>;
  }

  return <div>
    <div className="p-2 mt-3 mb-3 flex justify-between w-full gap-10">
      <p className="title text-lg outline-none h-full" >
        {note?.title ? <p contentEditable>{note.title}</p> : <span className="text-gray-500" contentEditable>Title</span>}
      </p>
      <div className="flex">
        {
          note?.owner === user.id ?
            <div>
              <InviteUser />
            </div>
            : null
        }

        {isFetchingCollaboration ? "fethcing" : ""}
        {
          collabs.length
            ?
            (
              <div className="flex ml-4 space-x-0">
                {collabs.map((collab) => <InviteAvatar key={collab.id} {...collab} />)}
              </div>
            )
            : null
        }
      </div>
    </div>
    <NoteEditor docUrl={docUrl} />
  </div>
}