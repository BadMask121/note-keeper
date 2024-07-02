import { Firestore } from "@google-cloud/firestore";
import { User, UserDTO } from "../entities/User";
import { DaoError } from "../errors/dao";
import { IUserDao } from "./IUserDao";

export class UserDao implements IUserDao {
  transaction!: FirebaseFirestore.Transaction;

  constructor(
    private readonly db: Firestore,
    private readonly tableName: string
  ) {}

  async get(id: string): Promise<User | null> {
    try {
      const user = (await this.db.collection(this.tableName).doc(id).get()).data() as User | null;

      if (!user) {
        return null;
      }

      return {
        ...user,
        id,
      };
    } catch (error) {
      throw new DaoError({
        name: "UserDao",
        message: "Unable to retrieve user information",
        id,
        error,
      });
    }
  }

  async getByUsername(username: string): Promise<User | null> {
    try {
      const userRef = this.db.collection(this.tableName).where("username", "==", username);

      let userDoc: FirebaseFirestore.QueryDocumentSnapshot<
        FirebaseFirestore.DocumentData,
        FirebaseFirestore.DocumentData
      >;

      if (this.transaction) {
        const doc = await this.transaction.get(userRef);
        userDoc = doc?.docs?.[0];
      } else {
        userDoc = (await userRef.get()).docs?.[0];
      }

      if (!userDoc) {
        return null;
      }

      const user = userDoc?.data() as User;
      const userId = userDoc.id;
      return {
        ...user,
        id: userId,
      };
    } catch (error) {
      throw new DaoError({
        name: "UserDao",
        message: "Unable to retrieve user information",
        error,
      });
    }
  }

  async create(userDto: UserDTO): Promise<User> {
    if (await this.doesUsernameExist(userDto.username)) {
      throw new DaoError({
        name: "UserDao",
        message: "User already exists",
        user: userDto,
      });
    }

    try {
      const payload: UserDTO = {
        ...userDto,
        name: userDto.name.trim(),
        username: userDto.username.trim(),
        created_at: Date.now(),
      };

      const userRef = await this.db.collection(this.tableName).add(payload);
      const userId = userRef.id;
      const user = (await userRef.get()).data() as UserDTO;

      return {
        ...user,
        id: userId,
      };
    } catch (error) {
      throw new DaoError({
        name: "UserDao",
        message: "Unable to create user",
        user: userDto,
        error,
      });
    }
  }

  async doesUsernameExist(username: string): Promise<boolean> {
    try {
      const user = await this.db
        .collection(this.tableName)
        .where("username", "==", username)
        .count()
        .get();

      const { count } = user.data();
      return count >= 1;
    } catch (error) {
      throw new DaoError({
        name: "UserDAO",
        message: "Error checking if user exists",
        username,
        tableName: this.tableName,
        error,
      });
    }
  }
}
