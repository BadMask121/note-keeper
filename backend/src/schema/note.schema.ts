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
    title: string().optional(),
    autoMergeDocId: string().optional(),
  }),
});

export const formatContentSchema = object({
  body: object({
    content: string({
      required_error: "content is required",
    }),
  }),
});

export type RetrieveNoteInput = TypeOf<typeof retrieveNoteSchema>;
export type CreateNoteInput = TypeOf<typeof createNoteSchema>["body"];
export type DeleteNoteInput = TypeOf<typeof deleteNoteSchema>;
export type FormatContentInput = TypeOf<typeof formatContentSchema>["body"];
