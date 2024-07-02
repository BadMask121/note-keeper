"use client"
import { getUser } from "@/lib/storage";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
const NoteProvider = dynamic(() => import("../../components/note-provider"), {
  ssr: false,
});
const NotePage = dynamic(() => import("../../components/note-page"), {
  ssr: false,
});

export default function Note() {
  const user = getUser();
  const router = useRouter();

  if (!user) {
    router.push("/");
    return
  }

  return (
    <NoteProvider>
      <NotePage />
    </NoteProvider>
  );
}