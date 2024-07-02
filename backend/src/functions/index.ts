import { Firestore } from "@google-cloud/firestore";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
// eslint-disable-next-line import/no-unresolved
import { https } from "firebase-functions/v2";
import { createServer } from "http";
import { Redis } from "ioredis";
import { CollaborationCacheDao } from "../dao/CollaborationCacheDao";
import { CollaborationDao } from "../dao/CollaboratorDao";
import { DaoTable } from "../dao/IDao";
import { NoteDao } from "../dao/NoteDao";
import { UserDao } from "../dao/UserDao";
import { InjectedDependency } from "../entities/Dependency";
import { authMiddleware } from "../middleware/auth";
import validate from "../middleware/validate";
import { inviteUserSchema, retrieveInvitedContributorsSchema } from "../schema/collaborator.schema";
import { createNoteSchema, retrieveNoteSchema } from "../schema/note.schema";
import { createUserSchema, getUserSchema } from "../schema/user.schema";
import { notFoundError } from "../utils/http";
import { logger } from "../utils/logger";
import { CreateNote } from "./create-note";
import { CreateUser } from "./create-user";
import { GetUser } from "./get-user";
import { InviteUserToNote } from "./invite-user-to-note";
import { RetrieveContributors } from "./retrieve-contributors";
import { RetrieveNote } from "./retrieve-note";
import { RetrieveNotes } from "./retrieve-notes";

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
app.use(cors());

// inject dependencies
app.set(InjectedDependency.Db, db);
app.set(InjectedDependency.UserDao, userDao);
app.set(InjectedDependency.NoteDao, noteDao);
app.set(InjectedDependency.CollabDao, collabDao);
app.set(InjectedDependency.CollabCacheDao, collabCacheDao);

// TODO: implement signup authorization layer
app.post("/user", validate(createUserSchema), CreateUser);
app.get("/user/:username", validate(getUserSchema), GetUser);

// middleware to authenticate user requests
app.use(authMiddleware);
app.post("/note", validate(createNoteSchema), CreateNote);
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
export const noteApp = https.onRequest(app);
