import { DaoError } from "../errors/dao";
import { Collaboration, CollaborationDTO } from "../entities/Collaboration";
import { ICollaborationDao } from "./ICollaboratorDao";
import { FieldValue, Firestore, Timestamp } from "@google-cloud/firestore";
import { serverTimestampToDate } from "../utils/date";

export class CollaborationDao implements ICollaborationDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: string
  ) {}

  async get(id: string): Promise<Collaboration | null> {
    try {
      const collab = (
        await this.db.collection(this.tableName).doc(id).get()
      ).data() as Collaboration | null;

      if (!collab) {
        return null;
      }

      const createdAt = serverTimestampToDate(collab.created_at as Timestamp);
      return { ...collab, created_at: createdAt };
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Collaboration not found",
        id,
      });
    }
  }

  async create(noteId: string, owner: string): Promise<Collaboration> {
    try {
      const payload: CollaborationDTO = {
        note_id: noteId,
        owner,
        created_at: FieldValue.serverTimestamp(),
        contributors: [],
      };

      let collabId: string | null = null;

      if (this.transaction) {
        const docRef = this.db.collection(this.tableName).doc();
        this.transaction.set(docRef, payload);
        collabId = docRef.id;
      } else {
        const collab = await this.db.collection(this.tableName).add(payload);
        collabId = collab.id;
      }

      return {
        id: collabId,
        ...payload,
      };
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Unable to create collaboration",
        owner,
        noteId,
        error,
      });
    }
  }

  async getAllContributors(id: string): Promise<string[]> {
    try {
      const collaboration = await this.get(id);
      return collaboration?.contributors || [];
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Unable to retrieve contributors",
        id,
        error,
      });
    }
  }

  async addContributors(id: string, contributors: string[]): Promise<void> {
    try {
      const prevContributors = await this.getAllContributors(id);
      const updatedContributors = [...new Set([...prevContributors, ...contributors])];

      await this.db.collection(this.tableName).doc(id).update({
        contributors: updatedContributors,
      });
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Unable to add contributors to collaboration",
        contributors,
        id,
        error,
      });
    }
  }

  async removeContributor(id: string, contributorId: string): Promise<void> {
    try {
      const updatedContributors = (await this.getAllContributors(id)).filter(
        (cId) => cId !== contributorId
      );

      await this.db.collection(this.tableName).doc(id).update({
        contributors: updatedContributors,
      });
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Unable to remove contributor from collaboration",
        contributorId,
        id,
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.collection(this.tableName).doc(id).delete();
    } catch (error) {
      throw new DaoError({
        name: "CollaborationDao",
        message: "Unable to delete collaboration",
        id,
        error,
      });
    }
  }
}
