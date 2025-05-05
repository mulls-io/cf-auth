import type { D1Database } from '@cloudflare/workers-types';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { auth } from './auth';
import type { Database } from './types';

export interface Env {
  DB: D1Database;
  BETTER_AUTH_URL: string;
  SITE_URL: string;
  ASSETS_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const d1Dialect = new D1Dialect({ database: env.DB });
    const db = new Kysely<Database>({ dialect: d1Dialect });
    const url = new URL(request.url);
    console.log(`Incoming request URL: ${url.toString()}`);

    // Handle auth endpoints
    if (url.pathname.startsWith("/api/auth")) {
      try {
        // Signup handler
        if (url.pathname === "/api/auth/signup" && request.method === "POST") {
          console.log("Handling POST /api/auth/signup");
          const body = await request.json();
          
          if (!body.email || !body.password) {
            return new Response(JSON.stringify({ 
              error: "Missing email or password" 
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }
          
          try {
            const { userId } = await auth.createUser(db, body.email, body.password);
            const token = await auth.generateId('token_');
            const session = await auth.createSession(db, userId);
            
            console.log(`User created successfully: ${userId}`);
            
            return new Response(JSON.stringify({ success: true, userId }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                // Set secure HTTP-only cookie for auth
                'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}` // 30 days
              }
            });
          } catch (e) {
            console.error("Signup error:", e);
            const message = e instanceof Error ? e.message : String(e);
            
            return new Response(JSON.stringify({ 
              error: "Signup failed", 
              message 
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }
        }
        
        // Login handler
        if (url.pathname === "/api/auth/login" && request.method === "POST") {
          console.log("Handling POST /api/auth/login");
          const body = await request.json();
          
          if (!body.email || !body.password) {
            return new Response(JSON.stringify({ 
              error: "Missing email or password" 
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }
          
          try {
            const { token, userId } = await auth.loginUser(db, body.email, body.password);
            
            console.log(`User logged in successfully: ${userId}`);
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}` // 30 days
              }
            });
          } catch (e) {
            console.error("Login error:", e);
            
            return new Response(JSON.stringify({ 
              error: "Invalid email or password" 
            }), { 
              status: 401, 
              headers: { 'Content-Type': 'application/json' } 
            });
          }
        }
        
        // Logout handler
        if (url.pathname === "/api/auth/logout" && request.method === "POST") {
          console.log("Handling POST /api/auth/logout");
          
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'auth-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' // Clear cookie
            }
          });
        }
        
        // Session check (for client-side)
        if (url.pathname === "/api/auth/session" && request.method === "GET") {
          console.log("Handling GET /api/auth/session");
          
          // Get token from cookie
          const cookies = request.headers.get('Cookie') || '';
          const tokenMatch = cookies.match(/auth-token=([^;]+)/);
          const token = tokenMatch ? tokenMatch[1] : null;
          
          if (!token) {
            return new Response(JSON.stringify({ authenticated: false }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const session = await auth.verifySession(db, token);
          if (!session) {
            return new Response(JSON.stringify({ authenticated: false }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Get user data (excluding password)
          const user = await db
            .selectFrom('user')
            .where('id', '=', session.userId)
            .select(['id', 'email', 'name', 'image'])
            .executeTakeFirst();
          
          return new Response(JSON.stringify({ 
            authenticated: true, 
            user 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.error(`Auth handler error for ${request.method} ${url.pathname}:`, e);
        console.error(`Error message: ${e?.message}`);
        if (e instanceof Error && e.stack) {
          console.error(`Stack trace: ${e.stack}`);
        }
        return new Response(JSON.stringify({ 
          error: "Auth handler error", 
          message: e instanceof Error ? e.message : String(e) 
        }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      
      // If no specific auth endpoint matched
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Protect routes
    if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin")) {
      // Get token from cookie
      const cookies = request.headers.get('Cookie') || '';
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        return Response.redirect(loginUrl.toString(), 302);
      }
      
      const session = await auth.verifySession(db, token);
      if (!session) {
        const loginUrl = new URL("/login", request.url);
        return Response.redirect(loginUrl.toString(), 302);
      }
    }

    // Proxy static assets
    console.log(`Proxying request for ${url.pathname} to static assets.`);
    const assetUrl = `${env.ASSETS_URL}${url.pathname}`;
    return fetch(assetUrl, request);
  }
};
