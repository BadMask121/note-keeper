export enum InjectedDependency {
  Db = "db",
  UserDao = "userDao",
  NoteDao = "noteDao",
  CollabDao = "collabDao",
  CollabCacheDao = "CollabCacheDao",
  Redis = "redis",
  OpenAI = "openai",
  User = "user",
}

export enum CacheKeyPrefix {
  User = "user:",
  Note = "note:",
  Notes = "notes:",
  Format = "format:",
  Contributors = "contributors:",
}
