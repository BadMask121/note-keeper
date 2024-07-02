import { Request, Response } from "express";
import { IUserDao } from "../dao/IUserDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { DaoError } from "../errors/dao";
import { CreateUserInput } from "../schema/user.schema";
import { badRequestError, HttpResponse, result, serverError } from "../utils/http";
import { Redis } from "ioredis";

export async function CreateUser(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<User>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

  const userInfo = req.body as CreateUserInput;

  try {
    const user = await userDao.create(userInfo);

    // cache stored user
    await redis.set(`${CacheKeyPrefix.User}${user.username}`, JSON.stringify(user));
    return result(res, user);
  } catch (error) {
    const err = error as DaoError;
    if (err?.innerError!.message!.includes("User already exists")) {
      return badRequestError(res, "username already taken");
    }

    return serverError(res, err);
  }
}
