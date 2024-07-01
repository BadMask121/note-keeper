import { Request, Response } from "express";
import { INoteDao } from "../dao/INoteDao";
import { InjectedDependency } from "../entities/Dependency";
import { HttpResponse, result, serverError } from "../utils/http";
import { Note } from "../entities/Note";

export async function RetrieveNotes(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<Note[]>>> {
  const noteDao = req.app.get(InjectedDependency.NoteDao) as INoteDao;
  const { user } = req;

  try {
    const note = await noteDao.getAllByOwner(user.id);
    return result(res, note);
  } catch (error) {
    return serverError(res, error as Error);
  }
}
