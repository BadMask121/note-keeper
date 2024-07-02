import { Request, Response } from "express";
import { INoteDao } from "../dao/INoteDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";
import { Note } from "../entities/Note";
import { Firestore } from "@google-cloud/firestore";
import { ICollaborationDao } from "../dao/ICollaboratorDao";

// retrieve all notes by owner and notes they are invited to
export async function RetrieveNotes(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note[]>>> {
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const db = req.app.get(InjectedDependency.Db) as Firestore;
  const { user } = req;

  try {
    const notes = await db.runTransaction(async (tx) => {
      collabDao.transaction = tx;

      const collabs = await collabDao.getUserCollaborations(user.id);
      const allNotes = await Promise.all(
        // get note based on collaborations
        collabs.map((collab) => noteDao.get(collab.note_id, { ownerId: collab.owner }))
      );
      const filternotes = allNotes.filter(Boolean) as Note[];
      const notes = filternotes.map((note) => ({
        ...note,
        isOwner: note?.owner === user.id,
      }));
      return notes;
    });

    return result(res, notes);
  } catch (error) {
    return serverError(res, error as Error);
  } finally {
    collabDao.transaction = undefined;
  }
}
