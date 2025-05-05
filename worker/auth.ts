// biome-ignore lint/style/useImportType: <explanation>
import { Kysely } from 'kysely';
import type { Database } from './types';

// Secure ID generation
function generateId(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`;
}

// Generate a secure random token
function generateToken() {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash password securely using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  // Convert password to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Create a digest (SHA-256 is widely available in browsers/workers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compare password with stored hash
async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

// Create a session and return token
async function createSession(db: Kysely<Database>, userId: string): Promise<string> {
  const sessionId = generateId('sess_');
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days 
  
  await db.insertInto('session')
    .values({
      id: sessionId,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .execute();
  
  return token;
}

// Verify session from token
async function verifySession(db: Kysely<Database>, token: string): Promise<{userId: string} | null> {
  const session = await db
    .selectFrom('session')
    .where('token', '=', token)
    .where('expiresAt', '>', new Date().toISOString())
    .select(['userId'])
    .executeTakeFirst();
  
  return session || null;
}

// User creation 
async function createUser(db: Kysely<Database>, email: string, password: string): Promise<{userId: string}> {
  // Check if user exists
  const existingUser = await db
    .selectFrom('user')
    .where('email', '=', email)
    .select('id')
    .executeTakeFirst();
  
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const userId = generateId('user_');
  const hashedPassword = await hashPassword(password);
  const timestamp = new Date().toISOString();
  
  await db.insertInto('user')
    .values({
      id: userId,
      email,
      password: hashedPassword,
      createdAt: timestamp,
      updatedAt: timestamp,
      emailVerified: false,
      name: null,
      image: null
    })
    .execute();
  
  return { userId };
}

// User login
async function loginUser(db: Kysely<Database>, email: string, password: string): Promise<{token: string, userId: string}> {
  const user = await db
    .selectFrom('user')
    .where('email', '=', email)
    .select(['id', 'password'])
    .executeTakeFirst();
  
  if (!user || !user.password) {
    throw new Error('Invalid email or password');
  }
  
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  const token = await createSession(db, user.id);
  return { token, userId: user.id };
}

export const auth = {
  createUser,
  loginUser,
  verifySession,
  generateId,
  hashPassword,
  comparePassword,
  createSession
}; 