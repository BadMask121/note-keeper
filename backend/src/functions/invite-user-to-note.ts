import { Firestore } from "@google-cloud/firestore";
import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";
import { InviteUserInput } from "../schema/collaborator.schema";
import { ICollaborationCacheDao } from "../dao/ICollaborationCacheDao";

export async function InviteUserToNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<{ contributors: string[] }>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const db = req.app.get(InjectedDependency.Db) as Firestore;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const collabCacheDao = req.app.get(InjectedDependency.CollabCacheDao) as ICollaborationCacheDao;

  const { usernames } = req.body as InviteUserInput;
  const { user } = req;
  const noteId = req.params.id;

  try {
    // get user ids of usernames
    const contributors = await db.runTransaction(async (tx) => {
      userDao.transaction = tx;
      collabDao.transaction = tx;

      // get userids from usernames
      const potentContributorsPromises = await Promise.all(
        usernames.map((username) => userDao.getByUsername(username))
      );

      const potentialContributors = potentContributorsPromises
        .map((contributorId) => contributorId?.id)
        // only return contributors that is not the owner
        .filter((contributorId) => contributorId && contributorId !== user.id) as string[];

      // add contributors as collaborators
      // add potential contributors in db
      const contributors = await collabDao.addContributors(noteId, user.id, potentialContributors);

      // add contributors in cache
      await collabCacheDao.addContributors(noteId, user.id, contributors);

      return contributors;
    });

    return result(res, { contributors });
  } catch (error) {
    return serverError(res, error as Error);
  }
}
