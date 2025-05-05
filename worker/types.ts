// Define your schema
export interface UserTable {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  password: string | null;
}

export interface SessionTable {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Database {
  user: UserTable;
  session: SessionTable;
} 