export interface Collaboration {
  id: string;
  note_id: string;
  owner: string;
  contributors?: string[];
  created_at?: unknown;
}

export interface CollaborationDTO {
  note_id: string;
  owner: string;
  contributors?: string[];
  created_at?: unknown;
}
