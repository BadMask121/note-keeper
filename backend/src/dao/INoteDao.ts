import { Note, NoteDTO } from "../entities/Note";

export interface INoteDao {
  transaction?: FirebaseFirestore.Transaction;

  get(id: string, filter?: { ownerId: string }): Promise<Note | null>;

  /**
   *
   * TODO: apply pagination
   * @param ownerId
   */
  getAllByOwner(ownerId: string): Promise<Note[]>;

  // /**
  //  * Returns all notes of owner and notes they are invited to
  //  * TODO: apply pagination
  //  * @param ownerId
  //  */
  // getAll(ownerId: string): Promise<Note[]>;

  create(owner: string, note: NoteDTO): Promise<Note>;

  // update(id: string, note: Partial<NoteDTO>): Promise<Note>;

  delete(id: string): Promise<void>;

  isExist(owner: string, noteTitle: string): Promise<boolean>;
}
