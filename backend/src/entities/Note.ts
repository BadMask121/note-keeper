export interface Note {
  id: string;
  title: string;
  owner: string;
  created_at?: unknown;
}

export interface NoteDTO {
  title: string;
  owner: string;
  created_at?: unknown;
}
