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

  /**
   * Get collaboration by note Id
   * @param noteId
   * @param filter
   */
  getCollaborationByNoteId(
    noteId: string,
    filter?: { ownerId?: string; contributorId?: string }
  ): Promise<Collaboration | null>;

  addContributors(noteId: string, ownerId: string, contributors: string[]): Promise<string[]>;

  removeContributor(id: string, contributorId: string): Promise<void>;

  getAllContributors(id: string): Promise<string[]>;

  /**
   * Get contributors by note Id
   * @param noteId
   * @param filter
   */
  getAllContributorsByNoteId(
    noteId: string,
    filter?: { ownerId?: string; contributorId?: string }
  ): Promise<string[]>;
}
