import { string, object, TypeOf } from "zod";

export const createUser = object({
  body: object({
    name: string({
      required_error: "name is required",
    }),
    username: string({
      required_error: "username is required",
    }),
  }),
});

export type CreateUserInput = TypeOf<typeof createUser>;
