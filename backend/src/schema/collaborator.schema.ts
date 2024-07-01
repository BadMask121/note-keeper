import { string, object, TypeOf, array } from "zod";

export const inviteUserSchema = object({
  body: object({
    usernames: array(
      string({
        required_error: "usernames are required",
      })
    ),
  }),
  params: object({
    id: string({
      required_error: "param id is required",
    }),
  }),
});

export const retrieveInvitedContributorsSchema = object({
  params: object({
    id: string({
      required_error: "param id is required",
    }),
  }),
});

export type InviteUserInput = TypeOf<typeof inviteUserSchema>["body"];
export type RetrieveInvitedContributorsInput = TypeOf<
  typeof retrieveInvitedContributorsSchema
>["params"];
