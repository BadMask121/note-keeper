"use client"
import dynamic from "next/dynamic";
const NoteProvider = dynamic(() => import("../../components/note-provider"), {
  ssr: false,
});

export default function Note() {
  return null
}
