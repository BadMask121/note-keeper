import { Request, Response } from "express";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { HttpResponse, result, serverError } from "../lib/http";

export async function GetUser(req: Request, res: Response): Promise<Response<HttpResponse<User>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  // const redis = req.app.get(InjectedDependency.Redis) as Redis;
  const { username } = req.params;

  // const cacheKey = `${CacheKeyPrefix.User}${username}`;
  try {
    // // Check cache
    // const cachedResult = await redis.get(cacheKey);
    // if (cachedResult) {
    //   return result(res, JSON.parse(cachedResult));
    // }

    const user = await userDao.getByUsername(username);

    // cache retrieved user
    // await redis.set(cacheKey, JSON.stringify(user));
    return result(res, user);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
