
export interface Response<T> {
  result: T
}
export interface User {
  id: string,
  name: string,
  username: string,
  created_at: string
}

export interface Note {
  id: string;
  title: string;
  owner: string;
  autoMergeDocId?: string;
  created_at?: number;
}

export interface Collaboration {
  id: string;
  note_id: string;
  owner: string;
  contributors?: string[];
  created_at?: unknown;
}


export type UserResponse = Response<User>

export type NoteResponse = Response<Note>
export type NotesResponse = Response<Note[]>

export type ContributorsResponse = Response<User[]>
