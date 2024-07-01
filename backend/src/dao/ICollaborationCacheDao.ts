export interface ICollaborationCacheDao {
  getContributors(docId: string): Promise<string[]>;

  getOwnerId(docId: string): Promise<string | null>;

  addContributors(docId: string, ownerId: string, contributors: string[]): Promise<string[]>;

  removeContributors(docId: string, contributors: string[]): Promise<string[]>;

  deleteCollaboration(docId: string, ownerId: string, contributors: string[]): Promise<string[]>;
}
