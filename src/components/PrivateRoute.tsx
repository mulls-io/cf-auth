import type React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../lib/auth-client"; // Adjust path if needed

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, error } = useSession();
  const location = useLocation();

  console.log(
    `PrivateRoute Check: Path=${
      location.pathname
    }, Loading=${loading}, User=${!!user}, Error=${!!error}`
  );

  if (loading) {
    // You might want to render a loading spinner here
    // For simplicity, returning null while loading is also an option,
    // or a full-page loader if preferred.
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading Session...
      </div>
    );
  }

  if (error || !user) {
    console.log(
      `PrivateRoute Redirecting: Path=${location.pathname} -> /login`
    );
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log(`PrivateRoute Allowing: Path=${location.pathname}`);
  // If authenticated, render the children component (the protected page)
  return <>{children}</>;
};

export default PrivateRoute;
