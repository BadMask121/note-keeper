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
import { createUser as createUserSchema } from "./schema/user.schema";
import { createNoteSchema } from "./schema/note.schema";
import { notFoundError } from "./utils/http";
import { inviteUserSchema } from "./schema/collaborator.schema";
import { InviteUserToNote } from "./functions/invite-user-to-note";

const port = 8181;
const app = express();
const db = new Firestore();
const userDao = new UserDao(db, DaoTable.User);
const noteDao = new NoteDao(db, DaoTable.Note);
const collabDao = new CollaborationDao(db, DaoTable.Collaborator);

app.use(bodyParser.json());

// inject dependencies
app.set(InjectedDependency.Db, db);
app.set(InjectedDependency.UserDao, userDao);
app.set(InjectedDependency.NoteDao, noteDao);
app.set(InjectedDependency.CollabDao, collabDao);

app.post("/user/new", validate(createUserSchema), CreateUser);

// Add middleware to authenticate user requests
app.use(authMiddleware);
app.post("/note/new", validate(createNoteSchema), CreateNote);
app.post("/note/{id}/invite", validate(inviteUserSchema), InviteUserToNote);

app.use((req, res) => {
  return notFoundError(res, "Route not found");
});

createServer(app).listen(port, () => {
  logger.info(`App running on ${port}`);
});

process.on("SIGTERM", () => {
  // Clean up resources on shutdown
  logger.info("Caught SIGTERM.");
  logger.flush();
});
// Expose Express API as a single Cloud Function:
export const noteApp = onRequest(app);
