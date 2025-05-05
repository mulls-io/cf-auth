CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN,
  image TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  password TEXT -- if using email/password auth
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt DATETIME,
  refreshTokenExpiresAt DATETIME,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME
);