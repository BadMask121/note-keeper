import { Firestore } from "@google-cloud/firestore";
import isNil from "lodash.isnil";
import omit from "lodash.omitby";
import { Note, NoteDTO } from "../entities/Note";
import { DaoError } from "../errors/dao";
import { INoteDao } from "./INoteDao";
import { DaoTable } from "./IDao";

export class NoteDao implements INoteDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: DaoTable
  ) {}

  async get(id: string, filter?: { ownerId: string }): Promise<Note | null> {
    try {
      const docRef = this.db.collection(this.tableName).doc(id);
      let noteSnap: FirebaseFirestore.DocumentSnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        noteSnap = await this.transaction.get(docRef);
      } else {
        noteSnap = await docRef.get();
      }

      const note = noteSnap.data() as Note | null;
      if (!note) {
        return null;
      }

      if (filter?.ownerId) {
        if (note.owner !== filter.ownerId) {
          return null;
        }
      }

      return {
        ...note,
        id,
        title: note.title ?? "",
      };
    } catch (error) {
      throw new DaoError({
        name: "NoteDao",
        message: "Unable to retrieve note",
        id,
        filter,
        error,
      });
    }
  }

  // TODO: apply pagination
  async getAllByOwner(ownerId: string): Promise<Note[]> {
    try {
      const docRef = this.db
        .collection(this.tableName)
        .where("owner", "==", ownerId)
        .orderBy("created_at", "desc");

      let noteSnap: FirebaseFirestore.QuerySnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        noteSnap = await this.transaction.get(docRef);
      } else {
        noteSnap = await docRef.get();
      }

      const notes = noteSnap.docs;
      if (!notes.length) {
        return [];
      }

      const allNotes = notes.map((doc) => {
        const note = doc.data() as Note;
        return {
          ...note,
          id: doc.id,
          title: note.title ?? "",
        };
      });

      return allNotes;
    } catch (error) {
      throw new DaoError({
        name: "NoteDao",
        message: "Unable to retrieve notes",
        ownerId,
        error,
      });
    }
  }

  async create(owner: string, noteDto: NoteDTO): Promise<Note> {
    // check if note already exists
    if (noteDto.title && (await this.isExist(owner, noteDto.title))) {
      throw new DaoError({
        name: "NoteDao",
        message: "Note already created",
        owner,
        note: noteDto,
      });
    }

    try {
      const payload = omit<NoteDTO>(
        {
          ...noteDto,
          title: noteDto?.title?.trim(),
          owner,
          created_at: Date.now(),
        },
        isNil
      );

      let noteRef: FirebaseFirestore.DocumentReference<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        noteRef = this.db.collection(this.tableName).doc();
        this.transaction.set(noteRef, payload);
      } else {
        noteRef = await this.db.collection(this.tableName).add(payload);
      }

      const noteId = noteRef.id;
      return {
        id: noteId,
        autoMergeDocId: payload?.autoMergeDocId,
        owner: payload.owner as string,
        title: payload.title ?? "",
        created_at: payload.created_at,
      };
    } catch (error) {
      throw new DaoError({
        name: "NoteDao",
        message: "Unable to create note",
        owner,
        note: noteDto,
        error,
      });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.collection(this.tableName).doc(id).delete();
    } catch (error) {
      throw new DaoError({
        name: "NoteDao",
        message: "Unable to delete note",
        id,
        error,
      });
    }
  }

  async isExist(owner: string, noteTitle: string): Promise<boolean> {
    try {
      const noteRef = this.db
        .collection(this.tableName)
        .where("owner", "==", owner)
        .where("title", "==", noteTitle)
        .count();

      let noteResult: FirebaseFirestore.AggregateQuerySnapshot<
        {
          count: FirebaseFirestore.AggregateField<number>;
        },
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        noteResult = await this.transaction.get(noteRef);
      } else {
        noteResult = await noteRef.get();
      }

      const { count } = noteResult.data();

      return count >= 1;
    } catch (error) {
      throw new DaoError({
        name: "NoteDao",
        message: "Error getting note",
        owner,
        error,
      });
    }
  }
}
