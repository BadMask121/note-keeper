import { Firestore } from "@google-cloud/firestore";
import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { INoteDao } from "../dao/INoteDao";
import { InjectedDependency } from "../entities/Dependency";
import { Note } from "../entities/Note";
import { DaoError } from "../errors/dao";
import { badRequestError, HttpResponse, result, serverError } from "../utils/http";

export async function CreateNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note>>> {
  const db = req.app.get(InjectedDependency.Db) as Firestore;

  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const { user } = req;
  const noteInfo = req.body as { title: string };

  try {
    /**
     * initiate a transaction to create a note and collaboration
     */
    const note = await db.runTransaction(async (transaction) => {
      noteDao.transaction = transaction;
      collabDao.transaction = transaction;

      const note = await noteDao.create(user.id, {
        owner: user.id,
        title: noteInfo.title,
      });

      await collabDao.create(note.id, user.id);
      return note;
    });

    return result<Note>(res, note);
  } catch (error) {
    const err = error as DaoError;
    if (err?.innerError!.message!.includes("Note already created")) {
      return badRequestError(res, "Note already created");
    }

    return serverError(res, error as Error);
  }
}
