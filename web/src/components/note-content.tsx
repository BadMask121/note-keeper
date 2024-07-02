import { useAppParams } from "@/hooks/useAppParams";
import { useGet } from "@/hooks/useFetch";
import { NoteResponse } from "@/lib/types";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useEffect, useMemo } from "react";
import { NoteEditor } from "./note-editor";
import { setSelectedNote } from "@/lib/storage";

export default function NoteContent() {
  const { selectedId } = useAppParams();
  const { data, isLoading } = useGet<NoteResponse>(selectedId ? `/note/${selectedId}` : null);

  useEffect(() => {
    if (data?.result) {
      setSelectedNote(data.result);
    }
  }, [data, selectedId]);

  const docUrl = useMemo(() => {
    if (data?.result?.autoMergeDocId) {
      return `automerge:${data.result.autoMergeDocId}` as AutomergeUrl;
    }
    return null
  }, [data]);

  if (!selectedId) {
    return <p>Open a note to view</p>
  };

  if (isLoading) {
    return <p>Loading document...</p>
  };

  if (!docUrl || !isValidAutomergeUrl(docUrl)) {
    return <p>No document found</p>;
  }

  return <NoteEditor docUrl={docUrl} />
}