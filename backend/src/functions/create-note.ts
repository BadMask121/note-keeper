import { Firestore } from "@google-cloud/firestore";
import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { INoteDao } from "../dao/INoteDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { Note } from "../entities/Note";
import { DaoError } from "../errors/dao";
import { badRequestError, HttpResponse, result, serverError } from "../lib/http";
import { CreateNoteInput } from "../schema/note.schema";
import { ICollaborationCacheDao } from "../dao/ICollaborationCacheDao";
import Redis from "ioredis";

export async function CreateNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note>>> {
  const db = req.app.get(InjectedDependency.Db) as Firestore;

  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const collabCacheDao = req.app.get(InjectedDependency.CollabCacheDao) as ICollaborationCacheDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

  const { user } = req;
  const noteInfo = req.body as CreateNoteInput;

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
        autoMergeDocId: noteInfo.autoMergeDocId,
      });

      await Promise.all([
        collabDao.create(note.id, user.id),
        collabCacheDao.addContributors(note.id, user.id, []),
      ]);

      return {
        ...note,
        isOwner: note.owner === user.id,
      };
    });

    // cache saved note
    await redis.set(`${CacheKeyPrefix.Note}${note.id}`, JSON.stringify(note));
    // expire notes TTL so it can be refetched
    await redis.expire(`${CacheKeyPrefix.Notes}${user.id}`, 0);

    return result<Note>(res, note);
  } catch (error) {
    const err = error as DaoError;
    if (err?.innerError.message!.includes("Note already created")) {
      return badRequestError(res, "Note already created");
    }

    return serverError(res, error as Error);
  } finally {
    // MUST TERMINATE TRANSACTION ONCE DONE
    noteDao.transaction = undefined;
    collabDao.transaction = undefined;
  }
}
