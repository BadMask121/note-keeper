export interface User {
  id: string;
  name: string;
  username: string;
  created_at?: unknown;
}

export interface UserDTO {
  name: string;
  username: string;
  created_at?: unknown;
}
