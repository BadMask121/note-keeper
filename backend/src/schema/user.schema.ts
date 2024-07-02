import { string, object, TypeOf } from "zod";

export const createUserSchema = object({
  body: object({
    name: string({
      required_error: "name is required",
    }),
    username: string({
      required_error: "username is required",
    }),
  }),
});

export const getUserSchema = object({
  params: object({
    username: string({
      required_error: "username is required",
    }),
  }),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];
export type GetUserInput = TypeOf<typeof getUserSchema>;
