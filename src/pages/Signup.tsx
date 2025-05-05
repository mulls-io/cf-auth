import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, sessionQueryKey } from "../lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signup(email, password);

      if (result.success) {
        console.log("[Signup] Attempting query invalidation...");
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
        console.log("[Signup] Query invalidation finished.");

        // Explicitly refetch and wait for the session query to settle
        try {
          console.log("[Signup] Refetching session query...");
          await queryClient.refetchQueries({
            queryKey: sessionQueryKey,
            exact: true,
          });
          console.log("[Signup] Session query refetch finished.");
        } catch (refetchError) {
          console.error(
            "[Signup] Error refetching session query:",
            refetchError
          );
          // Decide how to handle refetch error - maybe still try navigating?
          // Or show an error to the user?
        }

        // Delay slightly AFTER refetching, then navigate
        setTimeout(() => {
          console.log("[Signup] Navigating to dashboard after delay.");
          navigate("/dashboard");
        }, 50); // Shorter delay might be okay now
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
      <form onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: "20px" }}>Sign Up</h2>

        <div style={{ marginBottom: "15px" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {error && (
          <div
            style={{
              color: "red",
              marginTop: "15px",
              padding: "10px",
              background: "#fff8f8",
              borderRadius: "4px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0070f3" }}>
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
