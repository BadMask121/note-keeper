import { Firestore } from "@google-cloud/firestore";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
// eslint-disable-next-line import/no-unresolved
import { https } from "firebase-functions/v2";
import { createServer } from "http";
import { Redis } from "ioredis";
import OpenAI from "openai";
import { CollaborationCacheDao } from "../dao/CollaborationCacheDao";
import { CollaborationDao } from "../dao/CollaboratorDao";
import { DaoTable } from "../dao/IDao";
import { NoteDao } from "../dao/NoteDao";
import { UserDao } from "../dao/UserDao";
import { InjectedDependency } from "../entities/Dependency";
import { authMiddleware } from "../middleware/auth";
import validate from "../middleware/validate";
import { inviteUserSchema, retrieveInvitedContributorsSchema } from "../schema/collaborator.schema";
import { createNoteSchema, formatContentSchema, retrieveNoteSchema } from "../schema/note.schema";
import { createUserSchema, getUserSchema } from "../schema/user.schema";
import { notFoundError } from "../lib/http";
import { logger } from "../lib/logger";
import { FormatNote } from "./ai-format-content";
import { CreateNote } from "./create-note";
import { CreateUser } from "./create-user";
import { GetUser } from "./get-user";
import { InviteUserToNote } from "./invite-user-to-note";
import { RetrieveContributors } from "./retrieve-contributors";
import { RetrieveNote } from "./retrieve-note";
import { RetrieveNotes } from "./retrieve-notes";
import { getRedisInstanceUrl, getSecret } from "../lib/config";

dotenv.config();

const isDev = process.env.NODE_ENV === "development";
const openAIKey = isDev ? process.env.OPENAI_API_KEY : await getSecret("OPENAI_API_KEY");
const redisUrl = isDev ? process.env.REDIS_URL : await getRedisInstanceUrl();

const port = 8181;
const app = express();
const db = new Firestore();

const redisClient = new Redis(redisUrl as string);

const userDao = new UserDao(db, DaoTable.User);
const noteDao = new NoteDao(db, DaoTable.Note);
const collabDao = new CollaborationDao(db, DaoTable.Collaborator);
const collabCacheDao = new CollaborationCacheDao(redisClient);

// Initialize the OpenAI API with your API key
const openai = new OpenAI({
  apiKey: openAIKey,
});

app.use(bodyParser.json());
app.use(cors());

// inject dependencies
app.set(InjectedDependency.Db, db);
app.set(InjectedDependency.UserDao, userDao);
app.set(InjectedDependency.NoteDao, noteDao);
app.set(InjectedDependency.CollabDao, collabDao);
app.set(InjectedDependency.CollabCacheDao, collabCacheDao);
app.set(InjectedDependency.Redis, redisClient);
app.set(InjectedDependency.OpenAI, openai);

// Define a rate limiter with options
const defaultLimit = {
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
};

const apiLimiter = rateLimit(defaultLimit);

// TODO: implement signup authorization layer
app.post("/user", apiLimiter, validate(createUserSchema), CreateUser);
app.get("/user/:username", apiLimiter, validate(getUserSchema), GetUser);

// middleware to authenticate user requests
app.use(authMiddleware);
app.use(apiLimiter);
app.post("/note", validate(createNoteSchema), CreateNote);
app.put("/note/:id/invite", validate(inviteUserSchema), InviteUserToNote);
app.get("/note/:id/invite", validate(retrieveInvitedContributorsSchema), RetrieveContributors);
app.get("/note/:id", validate(retrieveNoteSchema), RetrieveNote);
app.get("/note", RetrieveNotes);

// AI routes
app.post(
  "/ai/format",
  rateLimit({
    ...defaultLimit,
    windowMs: 3 * 60 * 1000, // 3 minutes,
  }),
  validate(formatContentSchema),
  FormatNote
);

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
