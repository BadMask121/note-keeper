export interface Note {
  id: string;
  owner: string;
  /**
   * we need to this to be about to find out document in to merge,
   * this should not be required as it is only needed when using automerge on client and ws
   */
  autoMergeDocId?: string;
  title?: string;
  isOwner?: boolean;
  created_at?: number;
}

export interface NoteDTO {
  owner: string;
  /**
   * we need to this to be about to find out document in to merge,
   * this should not be required as it is only needed when using automerge on client and ws
   */
  autoMergeDocId?: string;
  title?: string;
  created_at?: number;
}
