"use client"

import SidebarNavItem from "@/components/sidebar-nav-item";
import { Button } from "@/components/ui/button";
import { useGet, usePost } from "@/hooks/useFetch";
import { parseDateToRelativeString } from "@/lib/date";
import { ProtectedRoutes } from "@/lib/routes";
import { delUser, getUser, setSelectedNote } from "@/lib/storage";
import { Note as INote, NoteResponse, NotesResponse } from "@/lib/types";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { toDate } from "date-fns";
import groupBy from "lodash.groupby";
import orderBy from "lodash.orderby";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { toast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

const NoteContent = dynamic(() => import("../components/note-content"), {
  ssr: false,
});
export default function NotePage() {
  const router = useRouter();
  const { data } = useGet<NotesResponse>("/note");
  const { trigger, isMutating } = usePost<NoteResponse, { autoMergeDocId: string }>("/note");
  const repo = useRepo();
  const user = getUser();
  const groupedData = useMemo(() => {
    const _data = getGroupedDate(data?.result || []);
    return Object.entries(_data);
  }, [data]);


  async function createNote() {
    try {
      const handle = repo.create({ text: "" });
      const docId = handle.documentId;
      const { result } = await trigger({
        autoMergeDocId: docId
      });

      if (result) {
        setSelectedNote(result);
        router.push(`${ProtectedRoutes.Note}/${result.id}`);
      }
      return
    } catch (error) {
      toast({
        description: "Unable to create note",
        variant: "destructive"
      })
    }
  }

  function signOut() {
    delUser()
    router.push("/")
  }


  return (
    <div className="flex h-screen gap-6">
      <div className="w-64 flex flex-col border p-5 justify-between">
        <div className="flex flex-col ">

          <Button onClick={createNote}>{isMutating ? "Creating..." : "New Note"}</Button>
          <div className="mt-5">
            {groupedData.length ? groupedData.map(([day, items]) => (
              <SideBarList
                key={day}
                day={day}
                items={items}
              />
            )) : (
              <div className="flex items-center justify-center">
                <p className="text-gray-400">No Notes</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="mb-5">{user.name}
            <span className="ml-2 text-xs text-gray-500">({user.username})</span>
          </p>
          <Button variant={"ghost"} className="w-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
      <div className="grow">
        <NoteContent />
      </div>
    </div >
  );
}


function SideBarList(props: Readonly<{
  day: string;
  items: INote[];
}>) {
  return (
    <div>
      <p className="mt-4 p-5 pt-0 text-sm font-medium">{props.day}</p>
      {/* chat list */}
      <div>
        {/* chat list item */}
        {props.items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}


function getGroupedDate(data: INote[]): Record<string, INote[]> {
  const sortedData = orderBy(data, "created_at", "desc");
  const _data = sortedData?.map((_) => ({
    ..._,
    created_at: _.created_at
      ? parseDateToRelativeString(toDate(_.created_at).toDateString())
      : _.created_at,
  }));

  const groupedData = groupBy(_data, "created_at");

  return groupedData as Record<string, INote[]>;
}
