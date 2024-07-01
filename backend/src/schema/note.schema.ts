import { string, object, TypeOf } from "zod";

export const retrieveNoteSchema = object({
  params: object({
    id: string({
      required_error: "id is required",
    }),
  }),
});

export const deleteNoteSchema = object({
  params: object({
    id: string({
      required_error: "id is required",
    }),
  }),
});

export const createNoteSchema = object({
  body: object({
    title: string({
      required_error: "note title is required",
    }),
  }),
});

export type RetrieveNoteInput = TypeOf<typeof retrieveNoteSchema>;
export type CreateNoteInput = TypeOf<typeof createNoteSchema>;
export type DeleteNoteInput = TypeOf<typeof deleteNoteSchema>;
