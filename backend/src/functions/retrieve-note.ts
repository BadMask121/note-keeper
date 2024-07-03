import { Request, Response } from "express";
import { INoteDao } from "../dao/INoteDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../lib/http";
import { Note } from "../entities/Note";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { Redis } from "ioredis";

// return note belonging to owner or contributor
export async function RetrieveNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note>>> {
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

  const { id } = req.params;
  const { user } = req;

  const cacheKey = `${CacheKeyPrefix.Note}${id}`;
  try {
    // Check cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return result(res, JSON.parse(cachedResult));
    }

    const [collaborator, note] = await Promise.all([
      // check if user is a contributor in note
      collabDao.getCollaborationByNoteId(id, { contributorId: user.id }),
      noteDao.get(id),
    ]);

    // user is owner of note or user is a contributor then return note
    if (note?.owner === user.id || collaborator) {
      return result(res, {
        ...note,
        isOwner: note?.owner === user.id,
      });
    }

    // cache retrieved note
    await redis.set(cacheKey, JSON.stringify(note));

    return result(res, null);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
