import * as ls from "local-storage";
import { Note, User } from "./types";

export const getUser = (): User => ls.get("user")
export const setUser = (user: User) => ls.set("user", user)

export const getDocUrl = (): User => ls.get("user")
export const setDocUrl = (user: User) => ls.set("user", user)

export const getSelectedNote = (): Note => ls.get("note")
export const setSelectedNote = (note: Note) => ls.set("note", note)
