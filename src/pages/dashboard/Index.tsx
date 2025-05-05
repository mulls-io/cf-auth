import { useNavigate } from "react-router-dom";
import { useSession, logout } from "../../lib/auth-client";

export default function Dashboard() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    const result = await logout();
    if (result.success) {
      navigate("/login");
    }
  }

  // If loading, show spinner (or null/placeholder)
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading Dashboard...
      </div>
    );
  }

  // PrivateRoute handles the redirect, so if we reach here and still have no user,
  // it's an unexpected state, but we shouldn't render the auth error/login button.
  // We could show a generic error or just nothing.
  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Error: User data not available after authentication check.
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
