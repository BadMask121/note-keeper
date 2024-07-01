import { Firestore } from "@google-cloud/firestore";
import { logger } from "../utils/logger";
import path from "path";

import { Chunk, StorageAdapterInterface, StorageKey } from "@automerge/automerge-repo";

export class FirebaseStorageAdapter implements StorageAdapterInterface {
  private cache: { [key: string]: Uint8Array } = {};

  tableName: string;

  client: Firestore;

  constructor() {
    this.tableName = "Changes";
    this.client = new Firestore();
  }

  async load(keyArray: StorageKey): Promise<Uint8Array | undefined> {
    const key = getKey(keyArray);
    const cacheValue = this.cache[key];
    if (cacheValue) {
      return cacheValue;
    }

    try {
      const result = (await this.client.collection(this.tableName).doc(key).get()).data();

      logger.info({ key }, "[LOAD DOCUMENT]::");

      const response = result?.value;
      // MUST RETURN UNDEFINED!
      if (!response) return undefined;
      return new Uint8Array(response);
    } catch (error) {
      logger.error(
        { action: "Load", key },
        "FirebaseStorageAdapter::Load ==> Error loading document"
      );
      throw error;
    }
  }

  async save(keyArray: StorageKey, binary: Uint8Array): Promise<void> {
    const key = getKey(keyArray);
    this.cache[key] = binary;

    try {
      logger.info({ action: "Save", key }, "FirebaseStorageAdapter::Save");
      await this.client
        .collection(this.tableName)
        .doc(key)
        .set({ value: Buffer.from(binary), id: key });
    } catch (e) {
      logger.error(
        { error: String(e), key },
        "FirebaseStorageAdapter::Save ==> Error saving document"
      );
    }
  }

  async remove(keyArray: string[]): Promise<void> {
    const key = getKey(keyArray);
    // remove from cache
    delete this.cache[key];

    try {
      logger.info({ action: "Remove", key }, "FirebaseStorageAdapter::Remove");
      await this.client.collection(this.tableName).doc(key).delete();
    } catch (e) {
      logger.error({ e, key }, "FirebaseStorageAdapter::Remove ==> Error deleting document");
    }
  }

  async loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    const cachedKeys = this.cachedKeys(keyPrefix);
    const storedKeys = await this.loadRangeKeys(keyPrefix);
    const allKeys = [...new Set([...cachedKeys, ...storedKeys])];

    const chunks = await Promise.all(
      allKeys.map(async (keyString) => {
        const key: StorageKey = keyString.split(path.sep);
        const data = await this.load(key);
        return { data, key };
      })
    );

    return chunks;
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    const key = getKey(keyPrefix);
    this.cachedKeys(keyPrefix).forEach((key) => delete this.cache[key]);
    try {
      logger.info({ key, keyPrefix }, "DELETE DOCUMENT RANGE");

      const id = keyPrefix[0];
      const results = this.client
        .collection(this.tableName)
        .orderBy("id")
        .startAt(id)
        .endAt(`${id}\uf8ff`);

      results.get().then((querySnapshot) => {
        querySnapshot.docs.forEach((doc) => {
          doc.ref.delete();
        });
      });

      logger.info({ key }, "DELETED MANY RANGE");
    } catch (e) {
      logger.error({ keyPrefix, key }, "[DELETE RANGE kEYS]");
    }
  }

  private cachedKeys(keyPrefix: string[]): string[] {
    const cacheKeyPrefixString = getKey(keyPrefix);
    return Object.keys(this.cache).filter((key) => key.startsWith(cacheKeyPrefixString));
  }

  private async loadRangeKeys(keyPrefix: string[]): Promise<string[]> {
    logger.info({ keyPrefix }, "LoadRange Keys");

    const id = keyPrefix[0];
    const results = this.client
      .collection(this.tableName)
      .orderBy("id")
      .startAt(id)
      .endAt(`${id}\uf8ff`);

    const keys: string[] = [];

    results.get().then((querySnapshot) => {
      querySnapshot.docs.forEach(async (doc) => {
        keys.push(doc.id);
      });
    });

    logger.info(
      { keyPrefix, response: keys, results: (await results.get()).docs.length },
      "[LOADED RANGE Keys]"
    );
    return keys;
  }
}

// HELPERS
function getKey(key: StorageKey): string {
  return key.join("-");
}
