import { Request, Response } from "express";
import { ICollaborationDao } from "../dao/ICollaboratorDao";
import { INoteDao } from "../dao/INoteDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";

export async function RetrieveContributors(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<{ contributors: string[] }>>> {
  const collabDao = req.app.get(InjectedDependency.CollabDao) as ICollaborationDao;
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;

  const { user } = req;
  const { id } = req.params;

  try {
    // if user is not owner then return empty array
    const note = await noteDao.get(id);
    if (note?.owner !== user.id) {
      result(res, { contributors: [] });
    }

    const contributors = await collabDao.getAllContributorsByNoteId(id, user.id);
    return result(res, { contributors });
  } catch (error) {
    return serverError(res, error as Error);
  }
}
