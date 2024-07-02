import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { INoteDao } from "../dao/INoteDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { Note } from "../entities/Note";
import { HttpResponse, result, serverError } from "../utils/http";
import { Redis } from "ioredis";

// retrieve all notes by owner and notes they are invited to
export async function RetrieveNotes(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note[]>>> {
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

  const { user } = req;

  const cacheKey = `${CacheKeyPrefix.Notes}${user.id}`;

  try {
    // Check cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return result(res, JSON.parse(cachedResult));
    }

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

    // cache retrieved notes
    await redis.set(cacheKey, JSON.stringify(notes));

    return result(res, notes);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
