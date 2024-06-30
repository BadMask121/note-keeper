import { Collaboration } from "../entities/Collaboration";

export interface ICollaborationDao {
  transaction: FirebaseFirestore.Transaction;

  get(id: string): Promise<Collaboration | null>;

  create(noteId: string, owner: string): Promise<Collaboration>;

  delete(id: string): Promise<void>;

  addContributors(id: string, contributors: string[]): Promise<void>;

  removeContributor(id: string, contributorId: string): Promise<void>;

  getAllContributors(id: string): Promise<string[]>;
}
