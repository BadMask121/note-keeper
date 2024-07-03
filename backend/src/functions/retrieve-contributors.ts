import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { HttpResponse, result, serverError } from "../lib/http";
import { Redis } from "ioredis";

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

  const cacheKey = `${CacheKeyPrefix.Contributors}${id}`;

  try {
    // Check cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return result(res, JSON.parse(cachedResult));
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
    await redis.set(cacheKey, JSON.stringify(users));

    return result(res, users);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
