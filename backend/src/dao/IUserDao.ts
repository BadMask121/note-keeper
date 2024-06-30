import { User, UserDTO } from "../entities/User";

export interface IUserDao {
  transaction: FirebaseFirestore.Transaction;

  get(id: string): Promise<User | null>;

  getByUsername(username: string): Promise<User | null>;

  create(user: UserDTO): Promise<User>;

  doesUsernameExist(username: string): Promise<boolean>;
}
