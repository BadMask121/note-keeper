import { Request, Response } from "express";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { HttpResponse, result, serverError } from "../utils/http";

export async function GetUser(req: Request, res: Response): Promise<Response<HttpResponse<User>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const { username } = req.params;

  try {
    const user = await userDao.getByUsername(username);
    return result(res, user);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
