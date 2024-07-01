import { Redis } from "ioredis";
import { DaoError } from "../errors/dao";
import { ICollaborationCacheDao } from "./ICollaborationCacheDao";

export class CollaborationCacheDao implements ICollaborationCacheDao {
  constructor(private readonly client: Redis) {}

  async getOwnerId(docId: string): Promise<string | null> {
    const ownerId = await this.client.get(this.buildOwnerKey({ docId }));
    return ownerId;
  }

  async getContributors(docId: string): Promise<string[]> {
    try {
      const conts = await this.client.smembers(this.buildContributorsKey({ docId }));
      return conts;
    } catch (error) {
      throw new DaoError({
        name: "CollaboratorRedisDao",
        message: "Unable to retrieve contributors",
        error,
        docId,
      });
    }
  }

  async addContributors(docId: string, ownerId: string, contributors: string[]): Promise<string[]> {
    try {
      await Promise.all([
        this.client.set(this.buildOwnerKey({ docId }), ownerId),
        this.client.sadd(this.buildContributorsKey({ docId }), ...contributors),
      ]);

      return contributors;
    } catch (error) {
      throw new DaoError({
        name: "CollaboratorRedisDao",
        message: "Unable to add contributors",
        ownerId,
        docId,
        error,
      });
    }
  }

  async removeContributors(docId: string, contributors: string[]): Promise<string[]> {
    try {
      await this.client.srem(this.buildContributorsKey({ docId }), ...contributors);
      return contributors;
    } catch (error) {
      throw new DaoError({
        name: "CollaboratorRedisDao",
        message: "Unable to remove contributors",
        docId,
        error,
      });
    }
  }

  async deleteCollaboration(
    docId: string,
    ownerId: string,
    contributors: string[]
  ): Promise<string[]> {
    try {
      await Promise.all([
        this.client.srem(this.buildContributorsKey({ docId }), ...contributors),
        this.client.del(this.buildOwnerKey({ docId }), ownerId),
      ]);
      return contributors;
    } catch (error) {
      throw new DaoError({
        name: "CollaboratorRedisDao",
        message: "Unable to delete collaboration",
        ownerId,
        docId,
        error,
      });
    }
  }

  private buildContributorsKey({ docId }: { docId: string }): string {
    return `${docId}:contributors`;
  }

  private buildOwnerKey({ docId }: { docId: string }): string {
    return `${docId}:owner`;
  }
}
