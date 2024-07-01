import { ICollaborationCacheDao } from "../dao/ICollaborationCacheDao";

// allow only invited contributors and owner to make changes to document
export async function validateSender(
  collabCache: ICollaborationCacheDao,
  docId: string,
  senderId: string
): Promise<boolean> {
  const documentOwnerId = await collabCache.getOwnerId(docId);
  const contributors = await collabCache.getContributors(docId);
  const senderIdContributor = contributors.find((contId) => contId === senderId);

  return Boolean(senderIdContributor || documentOwnerId);
}
