// eslint-disable-next-line import/no-unresolved
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { CreateNote } from "./functions/create-note";
import { CreateUser } from "./functions/create-user";
import { authMiddleware } from "./middleware/auth";
import { Firestore } from "@google-cloud/firestore";
import bodyParser from "body-parser";
import { UserDao } from "./dao/UserDao";
import { DaoTable } from "./dao/IDao";
import { createServer } from "http";
import { logger } from "./utils/logger";
import { NoteDao } from "./dao/NoteDao";
import { CollaborationDao } from "./dao/CollaboratorDao";
import { InjectedDependency } from "./entities/Dependency";
import validate from "./middleware/validate";
import { createUserSchema, getUserSchema } from "./schema/user.schema";
import { createNoteSchema, retrieveNoteSchema } from "./schema/note.schema";
import { notFoundError } from "./utils/http";
import { inviteUserSchema, retrieveInvitedContributorsSchema } from "./schema/collaborator.schema";
import { InviteUserToNote } from "./functions/invite-user-to-note";
import { CollaborationCacheDao } from "./dao/CollaborationCacheDao";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import { GetUser } from "./functions/get-user";
import { RetrieveNote } from "./functions/retrieve-note";
import { RetrieveNotes } from "./functions/retrieve-notes";
import { RetrieveContributors } from "./functions/retrieve-contributors";

dotenv.config();

const port = 8181;
const app = express();
const db = new Firestore();
const redisClient = new Redis(process.env.REDIS_URL as string);

const userDao = new UserDao(db, DaoTable.User);
const noteDao = new NoteDao(db, DaoTable.Note);
const collabDao = new CollaborationDao(db, DaoTable.Collaborator);
const collabCacheDao = new CollaborationCacheDao(redisClient);

app.use(bodyParser.json());

// inject dependencies
app.set(InjectedDependency.Db, db);
app.set(InjectedDependency.UserDao, userDao);
app.set(InjectedDependency.NoteDao, noteDao);
app.set(InjectedDependency.CollabDao, collabDao);
app.set(InjectedDependency.CollabCacheDao, collabCacheDao);

// TODO: implement signup authorization layer
app.post("/user/new", validate(createUserSchema), CreateUser);
app.post("/user/:username", validate(getUserSchema), GetUser);

// middleware to authenticate user requests
app.use(authMiddleware);
app.post("/note/new", validate(createNoteSchema), CreateNote);
app.put("/note/:id/invite", validate(inviteUserSchema), InviteUserToNote);
app.get("/note/:id/invite", validate(retrieveInvitedContributorsSchema), RetrieveContributors);
app.get("/note/:id", validate(retrieveNoteSchema), RetrieveNote);
app.get("/note", RetrieveNotes);

app.use((req, res) => {
  return notFoundError(res, "Route not found");
});

createServer(app).listen(port, () => {
  logger.info(`App running on ${port}`);
});

process.on("SIGTERM", async () => {
  // Clean up resources on shutdown
  logger.info("Caught SIGTERM.");
  logger.flush();
  await redisClient.quit();
});
// Expose Express API as a single Cloud Function:
export const noteApp = onRequest(app);
