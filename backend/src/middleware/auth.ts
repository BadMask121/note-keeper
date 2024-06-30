import { NextFunction, Request, Response } from "express";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { serverError, unauthorized } from "../utils/http";
/** Jwt authentic and return profile */
// TODO: implement JWT authentication
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
    const userId = req.get("user_id");

    if (!userId) {
      return unauthorized(res);
    }

    const user = await userDao.get(userId);
    if (!user) return unauthorized(res);

    Object.assign(req, { user });
    next();
  } catch (error) {
    return serverError(res, error as Error);
  }
}
