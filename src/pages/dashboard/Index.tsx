import { useNavigate } from "react-router-dom";
import { useSession, logout } from "../../lib/auth-client";

export default function Dashboard() {
  const { user, loading, error } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    const result = await logout();
    if (result.success) {
      navigate("/login");
    }
  }

  // If loading, show spinner
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
    );
  }

  // If error or no user (not authenticated)
  if (error || !user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Authentication Error</h2>
        <p>{error || "You must be logged in to view this page"}</p>
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 20px",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <div
        style={{
          background: "#f4f4f4",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2>Welcome, {user.name || user.email}!</h2>
        <p>User ID: {user.id}</p>
        <p>Email: {user.email}</p>
      </div>

      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          background: "#ff4d4f",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Logout
      </button>
    </div>
  );
}
