import { Firestore } from "@google-cloud/firestore";
import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";

export async function InviteUserToNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<{ contributors: string[] }>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const db = req.app.get(InjectedDependency.Db) as Firestore;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;

  const { usernames } = req.body as { usernames: string[] };
  const noteId = req.params.id;

  try {
    // get user ids of usernames
    const contributors = await db.runTransaction(async (tx) => {
      userDao.transaction = tx;
      collabDao.transaction = tx;

      const contributors = (
        await Promise.all(usernames.map((username) => userDao.getByUsername(username)))
      )
        .map((user) => user?.id)
        .filter(Boolean) as string[];

      // add contributors as collaborators
      await collabDao.addContributors(noteId, contributors);
      return contributors;
    });

    return result(res, contributors);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
