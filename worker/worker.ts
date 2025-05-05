import type { D1Database } from '@cloudflare/workers-types';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { auth } from './auth';
import type { Database } from './types';

export interface Env {
  DB: D1Database;
  SITE_URL: string;
  ASSETS_URL: string;
}

// CORS Helper function
function handleOptions(request: Request, env: Env): Response {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    // Handle CORS preflight requests.
    // Allow requests from the site URL specified in environment variables.
    const allowedOrigin = env.SITE_URL; // Use SITE_URL for allowed origin
    
    // Check if the request Origin matches the allowed origin
    if (headers.get("Origin") !== allowedOrigin) {
        // If not, return a response denying access
        return new Response(null, {
            status: 403, // Forbidden
            statusText: "Forbidden",
            headers: {
                'Access-Control-Allow-Origin': 'null' // Deny explicitly
            }
        });
    }

    const respHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS", // Add methods you need
      "Access-Control-Max-Age": "86400", // Cache preflight for 1 day
      // Allow specific headers. Adjust if your frontend sends others.
      "Access-Control-Allow-Headers": headers.get("Access-Control-Request-Headers") || "Content-Type",
      // If using credentials/cookies:
      "Access-Control-Allow-Credentials": "true", 
    };
    return new Response(null, { headers: respHeaders });
  }
  // Handle standard OPTIONS request if it wasn't a CORS preflight.
  return new Response(null, { headers: { Allow: "GET, HEAD, POST, OPTIONS" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests (OPTIONS method)
    if (request.method === "OPTIONS") {
      return handleOptions(request, env);
    }

    // Add CORS headers to actual responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.SITE_URL, // Allow frontend origin
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Allow-Credentials': 'true', // If using cookies/auth headers
      // Add other headers as needed, e.g., 'Access-Control-Allow-Headers' if required
    };

    const d1Dialect = new D1Dialect({ database: env.DB });
    const db = new Kysely<Database>({ dialect: d1Dialect });
    const url = new URL(request.url);
    console.log(`Incoming request URL: ${url.toString()}`);

    // Variable to hold the eventual response
    let response: Response;

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
            
            // Get the actual session token from createSession
            const sessionToken = await auth.createSession(db, userId); 

            console.log(`User created successfully: ${userId}`);
            
            response = new Response(JSON.stringify({ success: true, userId }), {
              status: 200,
              headers: { 
                // Use the correct sessionToken in the Set-Cookie header
                ...{ 'Content-Type': 'application/json', 'Set-Cookie': `auth-token=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}` }, 
                ...corsHeaders 
              }
            });
            return response; // Return immediately
          } catch (e) {
            console.error("Signup error:", e);
            const message = e instanceof Error ? e.message : String(e);
            
            response = new Response(JSON.stringify({ 
              error: "Signup failed", 
              message 
            }), { 
              status: 400, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            });
            return response;
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
            
            response = new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`, // 30 days
                ...corsHeaders
              }
            });
            return response;
          } catch (e) {
            console.error("Login error:", e);
            
            response = new Response(JSON.stringify({ 
              error: "Invalid email or password" 
            }), { 
              status: 401, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            });
            return response;
          }
        }
        
        // Logout handler
        if (url.pathname === "/api/auth/logout" && request.method === "POST") {
          console.log("Handling POST /api/auth/logout");
          
          response = new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'auth-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0', // Clear cookie
              ...corsHeaders
            }
          });
          return response;
        }
        
        // Session check (for client-side)
        if (url.pathname === "/api/auth/session" && request.method === "GET") {
          console.log("[Worker /api/auth/session] Handling GET /api/auth/session");
          
          // Get token from cookie
          const cookies = request.headers.get('Cookie') || '';
          console.log(`[Worker /api/auth/session] Received cookies: ${cookies}`);
          const tokenMatch = cookies.match(/auth-token=([^;]+)/);
          const token = tokenMatch ? tokenMatch[1] : null;
          
          if (!token) {
            console.log("[Worker /api/auth/session] No auth-token cookie found.");
            response = new Response(JSON.stringify({ authenticated: false }), {
                status: 200,
                headers: { ...{ 'Content-Type': 'application/json' }, ...corsHeaders }
            });
            return response;
          }
          
          console.log(`[Worker /api/auth/session] Found token: ${token.substring(0, 6)}... Attempting verification.`);
          const session = await auth.verifySession(db, token);
          
          if (!session) {
            console.log("[Worker /api/auth/session] auth.verifySession returned null.");
            response = new Response(JSON.stringify({ authenticated: false }), {
                status: 200,
                headers: { ...{ 'Content-Type': 'application/json' }, ...corsHeaders }
            });
            return response;
          }
          
          console.log(`[Worker /api/auth/session] Session verified for UserID: ${session.userId}. Fetching user details.`);
          // Get user data (excluding password)
          const user = await db
            .selectFrom('user')
            .where('id', '=', session.userId)
            .select(['id', 'email', 'name', 'image'])
            .executeTakeFirst();
          
          response = new Response(JSON.stringify({ 
            authenticated: true, 
            user 
          }), {
            status: 200,
            headers: { ...{ 'Content-Type': 'application/json' }, ...corsHeaders }
          });
          return response;
        }
      } catch (e) {
        console.error(`Auth handler error for ${request.method} ${url.pathname}:`, e);
        console.error(`Error message: ${e?.message}`);
        if (e instanceof Error && e.stack) {
          console.error(`Stack trace: ${e.stack}`);
        }
        response = new Response(JSON.stringify({ 
          error: "Auth handler error", 
          message: e instanceof Error ? e.message : String(e) 
        }), { 
          status: 500, 
          headers: { ...{ 'Content-Type': 'application/json' }, ...corsHeaders }
        });
        return response;
      }
      
      // If no specific auth endpoint matched
      response = new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { ...{ 'Content-Type': 'application/json' }, ...corsHeaders }
      });
    } else if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin")) {
      // Protect routes
      // Get token from cookie
      const cookies = request.headers.get('Cookie') || '';
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (!token) {
        const loginUrl = new URL("/login", env.SITE_URL);
        response = Response.redirect(loginUrl.toString(), 302);
      } else {
        const session = await auth.verifySession(db, token);
        if (!session) {
          const loginUrl = new URL("/login", env.SITE_URL);
          response = Response.redirect(loginUrl.toString(), 302);
        } else {
          console.log(`Proxying authenticated request for ${url.pathname} to frontend server at ${env.ASSETS_URL}`);
          const assetUrl = `${env.ASSETS_URL}${url.pathname}${url.search}`;
          const proxyRequest = new Request(assetUrl, request);
          const assetOrigin = new URL(env.ASSETS_URL);
          proxyRequest.headers.set('Host', assetOrigin.host);
          response = await fetch(proxyRequest);
        }
      }
    } else {
      // Proxy all other requests (non-API, non-protected) to the ASSETS_URL.
      console.log(`Proxying request for ${url.pathname} to frontend server at ${env.ASSETS_URL}`);
      const assetUrl = `${env.ASSETS_URL}${url.pathname}${url.search}`;
      const proxyRequest = new Request(assetUrl, request);
      const assetOrigin = new URL(env.ASSETS_URL);
      proxyRequest.headers.set('Host', assetOrigin.host);
      response = await fetch(proxyRequest);
    }

    // Add CORS headers to the final response if it wasn't already handled
    // This is a fallback - ideally CORS is added where the response is created.
    // Need to clone the response to modify headers if it came from fetch()
    if (response.headers.get('Access-Control-Allow-Origin') === null) {
        const clonedResponse = new Response(response.body, response);
        for (const [key, value] of Object.entries(corsHeaders)) {
            clonedResponse.headers.append(key, value);
        }
        return clonedResponse;
    }

    return response;
  }
};
