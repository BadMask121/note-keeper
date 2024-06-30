import { Firestore } from "@google-cloud/firestore";
import firebaseAdmin from "firebase-admin";

import { logger } from "../utils/logger";
import path from "path";

import { Chunk, StorageAdapterInterface, StorageKey } from "@automerge/automerge-repo";

export class FirebaseStorageAdapter implements StorageAdapterInterface {
  private cache: { [key: string]: Uint8Array } = {};

  tableName: string;

  client: Firestore;

  constructor() {
    this.tableName = "Changes";
    const firebaseConfig = {
      apiKey: "AIzaSyBd0yUnGYsmiBxNH_YHPLNHka7mlSs-Ro8",
      authDomain: "tappz-d2142.firebaseapp.com",
      projectId: "tappz-d2142",
      storageBucket: "tappz-d2142.appspot.com",
      messagingSenderId: "49074897583",
      appId: "1:49074897583:web:c1f2cfff47d40955424a5a",
    };

    firebaseAdmin.initializeApp(firebaseConfig);
    this.client = new Firestore();
  }

  async load(keyArray: StorageKey): Promise<Uint8Array | undefined> {
    const key = getKey(keyArray);
    const cacheValue = this.cache[key];
    if (cacheValue) {
      console.log(cacheValue, "cached value");
      return cacheValue;
    }

    try {
      const result = [];
      // const result = await query(`SELECT * FROM "${this.tableName}" WHERE key = $1`, [key]);
      logger.info({ value: result?.length, key }, "[LOAD DOCUMENT]::");

      const response = result?.[0];
      // MUST RETURN UNDEFINED!
      if (!response) return new Uint8Array([]);
      return new Uint8Array(response);
      // return new Uint8Array(response.value);
    } catch (error) {
      logger.error(
        { action: "Load", key },
        "PostgresStorageAdaptser::Load ==> Error loading document"
      );
      throw error;
    }
  }

  async save(keyArray: StorageKey, binary: Uint8Array): Promise<void> {
    const key = getKey(keyArray);
    this.cache[key] = binary;

    try {
      logger.info({ action: "Save", key }, "PostgresStorageAdaptser::Save");
      await this.client
        .collection(this.tableName)
        .doc(key)
        .set({ value: Buffer.from(binary) });
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

    console.log(chunks, "loading all");
    return [];
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    const key = getKey(keyPrefix);
    this.cachedKeys(keyPrefix).forEach((key) => delete this.cache[key]);
    try {
      logger.info({ key, keyPrefix }, "DELETE DOCUMENT RANGE");
      // const result = await query(
      //   `DELETE FROM "${this.tableName}" WHERE key LIKE $1 RETURNING key`,
      //   [`${key}%`]
      // );
      console.log({ result: null, key }, "DELETED MANY RANGE");
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
    const response = [];
    // const response = await query(`SELECT key FROM "${this.tableName}" WHERE key LIKE $1`, [
    //   `${keyPrefix}%`,
    // ]);
    logger.info({ keyPrefix, response: response?.length }, "[LOADED RANGE Keys]");

    // return response ? response.map((row) => row.key) : [];
    return [];
  }
}

// HELPERS
function getKey(key: StorageKey): string {
  return key.join("-");
}
