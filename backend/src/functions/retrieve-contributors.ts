import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { User } from "../entities/User";
import { HttpResponse, result, serverError } from "../utils/http";

export async function RetrieveContributors(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<User[]>>> {
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;

  const { user } = req;
  const { id } = req.params;

  try {
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

    return result(res, users);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
