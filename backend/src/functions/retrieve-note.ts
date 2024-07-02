import { Request, Response } from "express";
import { INoteDao } from "../dao/INoteDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";
import { Note } from "../entities/Note";
import { ICollaborationDao } from "../dao/ICollaboratorDao";

// return note belonging to owner or contributor
export async function RetrieveNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note>>> {
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const { id } = req.params;
  const { user } = req;

  try {
    const [collaborator, note] = await Promise.all([
      // check if user is a contributor in note
      collabDao.getCollaborationByNoteId(id, { contributorId: user.id }),
      noteDao.get(id),
    ]);

    // user is owner of note or user is a contributor then return note
    if (note?.owner === user.id || collaborator) {
      return result(res, {
        ...note,
        isOwner: note?.owner === user.id,
      });
    }

    return result(res, null);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
