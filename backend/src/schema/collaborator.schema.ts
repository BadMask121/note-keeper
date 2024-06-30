import { string, object, TypeOf, array } from "zod";

export const inviteUserSchema = object({
  body: object({
    usernames: array(
      string({
        required_error: "usernames are required",
      })
    ),
    collaboration_id: string({
      required_error: "collaboration_id id required",
    }),
  }),
  param: object({
    id: string({
      required_error: "id param id required",
    }),
  }),
});

export type InviteUserInput = TypeOf<typeof inviteUserSchema>;
