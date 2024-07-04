import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { HttpResponse, result, serverError } from "../lib/http";
import { Redis } from "ioredis";
import { Note } from "../entities/Note";

// TODO: cache result
export async function RetrieveContributors(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<User[]>>> {
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

  const { user } = req;
  const { id } = req.params;

  const contributorsCacheKey = `${CacheKeyPrefix.Contributors}${id}`;
  const noteCacheKey = `${CacheKeyPrefix.Note}${id}`;

  try {
    // Check cache
    const cachedResult = await redis.get(contributorsCacheKey);
    const noteResult = await redis.get(noteCacheKey);
    const cachedContributors = JSON.parse(cachedResult || '""');

    if (cachedContributors?.length && noteResult) {
      const note = JSON.parse(noteResult) as Note;
      // get contributor user info
      const uContributors = await Promise.all(
        (cachedContributors as string[]).map(async (c) => {
          const uUser = await redis.get(`${CacheKeyPrefix.User}${c}`);
          return uUser ? (JSON.parse(uUser) as User) : null;
        })
      );

      // remove nullish values
      const contributors = uContributors.filter(Boolean) as User[];

      const isContributor = contributors.find((c) => c.id === user.id);
      const isOwner = note.owner === user.id;

      // if user is not owner of note but is a contributor
      // return owner  as sole contributor so as to show on client who the owner is
      if (!isOwner && isContributor) {
        // get owner user info from cache
        const ownerRes = await redis.get(`${CacheKeyPrefix.User}${note.owner}`);
        if (ownerRes) {
          const ownerUser = JSON.parse(ownerRes) as User;
          // return owner of note as sole contributor
          return result(res, [ownerUser]);
        }

        return result(res, []);
      }

      return result(res, contributors);
    }

    // get contributors assigned by owner
    const collaboration = await collabDao.getCollaborationByNoteId(id, {
      ownerId: user.id,
    });

    // if user is not owner then return empty array
    if (collaboration?.owner !== user.id) {
      return result(res, []);
    }

    const { contributors = [] } = collaboration;
    // get contributors user information
    const users = (await Promise.all(contributors.map((col) => userDao.get(col)))).filter(
      Boolean
    ) as User[];

    // cache retrieved contributors
    await redis.set(contributorsCacheKey, JSON.stringify(users));

    return result(res, users);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
