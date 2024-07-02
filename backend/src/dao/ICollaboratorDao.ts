import { Collaboration } from "../entities/Collaboration";

export interface ICollaborationDao {
  transaction?: FirebaseFirestore.Transaction;

  get(id: string): Promise<Collaboration | null>;

  create(noteId: string, owner: string): Promise<Collaboration>;

  delete(id: string): Promise<void>;

  /**
   * Returns an array of collaboration a user belongs
   * @param id
   */
  getUserCollaborations(userId: string): Promise<Collaboration[]>;

  addContributors(noteId: string, ownerId: string, contributors: string[]): Promise<string[]>;

  removeContributor(id: string, contributorId: string): Promise<void>;

  getAllContributors(id: string): Promise<string[]>;

  getAllContributorsByNoteId(noteId: string, ownerId: string): Promise<string[]>;
}
