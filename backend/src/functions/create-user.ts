import { Request, Response } from "express";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { User, UserDTO } from "../entities/User";
import { DaoError } from "../errors/dao";
import { badRequestError, HttpResponse, result, serverError } from "../utils/http";

export async function CreateUser(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<User>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const userInfo = req.body as UserDTO;

  try {
    const user = userDao.create(userInfo);
    return result(res, user);
  } catch (error) {
    const err = error as DaoError;
    if (err?.innerError!.message!.includes("User already exists")) {
      return badRequestError(res, "username already taken");
    }

    return serverError(res, err);
  }
}
