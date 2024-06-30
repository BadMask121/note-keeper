import { Note, NoteDTO } from "../entities/Note";

export interface INoteDao {
  transaction: FirebaseFirestore.Transaction;

  get(id: string): Promise<Note | null>;

  create(owner: string, note: NoteDTO): Promise<Note>;

  // update(id: string, note: Partial<NoteDTO>): Promise<Note>;

  delete(id: string): Promise<void>;

  isExist(owner: string, noteTitle: string): Promise<boolean>;
}
