import { Firestore } from "@google-cloud/firestore";
import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { IUserDao } from "../dao/IUserDao";
import { CacheKeyPrefix, InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../lib/http";
import { InviteUserInput } from "../schema/collaborator.schema";
import { ICollaborationCacheDao } from "../dao/ICollaborationCacheDao";
import { User } from "../entities/User";
import { Redis } from "ioredis";
import { INoteDao } from "../dao/INoteDao";
import { Note } from "../entities/Note";

export async function InviteUserToNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<User[]>>> {
  const userDao = req.app.get(InjectedDependency.UserDao) as IUserDao;
  const db = req.app.get(InjectedDependency.Db) as Firestore;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabCacheDao = req.app.get(InjectedDependency.CollabCacheDao) as ICollaborationCacheDao;
  const redis = req.app.get(InjectedDependency.Redis) as Redis;

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

      const contPromises = contributors.map((col) => userDao.get(col));

      // get contributors user info
      const usersP = Promise.all(contPromises);
      // get contributo info and note
      const [nullishUsers, note] = await Promise.all([usersP, noteDao.get(noteId)]);
      const users = nullishUsers.filter(Boolean) as User[];

      // invalidate invited user notes
      if (note) {
        const notesPromise = contributors.map(async (contributorId) => {
          // get previous cached notes
          const prevNotesUnparsed = await redis.get(`${CacheKeyPrefix.Notes}${contributorId}`);
          // parse notes
          const prevNotes = prevNotesUnparsed ? (JSON.parse(prevNotesUnparsed) as Note[]) : [];
          // if note already added remove note and add again
          const newNotes = [note, ...prevNotes.filter((n) => n.id !== note?.id)];
          // set new cache for user notes
          return redis.set(`${CacheKeyPrefix.Notes}${contributorId}`, JSON.stringify(newNotes));
        });

        await Promise.all(notesPromise);
      }

      // cache contributors
      await redis.set(`${CacheKeyPrefix.Contributors}${noteId}`, JSON.stringify(contributors));

      return users;
    });

    return result(res, contributors);
  } catch (error) {
    return serverError(res, error as Error);
  } finally {
    userDao.transaction = undefined;
    collabDao.transaction = undefined;
  }
}
