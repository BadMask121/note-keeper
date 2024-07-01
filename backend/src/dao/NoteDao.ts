import { FieldValue, Firestore, Timestamp } from "@google-cloud/firestore";
import { Note, NoteDTO } from "../entities/Note";
import { INoteDao } from "./INoteDao";
import { DaoError } from "../errors/dao";
import { serverTimestampToDate } from "../utils/date";

export class NoteDao implements INoteDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: string
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

      const createdAt = serverTimestampToDate(note.created_at as Timestamp);
      return {
        ...note,
        id,
        created_at: createdAt,
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
        const createdAt = serverTimestampToDate(note.created_at as Timestamp);
        return {
          ...note,
          id: doc.id,
          created_at: createdAt,
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
    if (await this.isExist(owner, noteDto.title)) {
      throw new DaoError({
        name: "NoteDao",
        message: "Note already created",
        owner,
        note: noteDto,
      });
    }

    try {
      const payload: NoteDTO = {
        ...noteDto,
        title: noteDto.title.trim(),
        owner,
        created_at: FieldValue.serverTimestamp(),
      };

      let noteId: string | null = null;

      if (this.transaction) {
        const noteRef = this.db.collection(this.tableName).doc();
        this.transaction.set(noteRef, payload);
        noteId = noteRef.id;
      } else {
        const noteRef = await this.db.collection(this.tableName).add(payload);
        noteId = noteRef.id;
      }

      return {
        ...payload,
        id: noteId,
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
