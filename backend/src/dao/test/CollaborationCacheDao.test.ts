import { Redis } from "ioredis";
import { CollaborationCacheDao } from "../CollaborationCacheDao";
import dotenv from "dotenv";

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL as string);
const docId = "docId";
const ownerId = "ownerId";
const collabId = "collabId";
const collabId2 = "collabId2";

let collabDao: CollaborationCacheDao;

describe("CollaborationCacheDao", () => {
  beforeEach(() => {
    collabDao = new CollaborationCacheDao(redisClient);
  });

  it("should getOwnerId", async () => {
    const conts = await collabDao.addContributors(docId, ownerId, [collabId, collabId2]);
    const owner = await collabDao.getOwnerId(docId);
    if (owner) {
      await collabDao.deleteCollaboration(docId, owner as string, conts);
    }
    expect(owner).toBe(ownerId);
  });
});
