import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

import RoleSelection from "./RoleSelection";
import Auth from "./RESIDENTS/Auth";
import ResidentDashboard from "./RESIDENTS/ResidentDashboard";
import LinemanAuth from "./LINEMAN/LinemanAuth";
import LinemanDashboard from "./LINEMAN/LinemanDashboard";
// 1. Import the new Dev component (Adjust the path if you saved it elsewhere!)
import LinemanRegister from "./LINEMAN/LinemanRegister"; 

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [appLoading, setAppLoading] = useState(true);
  const [roleFetching, setRoleFetching] = useState(false);
  const [authView, setAuthView] = useState("selection");

  // 2. Add a simple check for the hidden development route
  const isDevRoute = window.location.pathname === "/dev-lineman-signup";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setAppLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setRoleFetching(true);
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setAuthView("selection");
        setAppLoading(false);
        setRoleFetching(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    let attempts = 5;
    const delay = 1000;

    while (attempts > 0) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role_id")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUserRole(data.role_id);
          setAppLoading(false);
          setRoleFetching(false);
          return;
        }

        console.log(
          `Profile row pending creation. Retrying... (${attempts - 1} left)`,
        );
      } catch (error) {
        console.error("Error matching profile role:", error.message);
      }

      attempts--;
      if (attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setAppLoading(false);
    setRoleFetching(false);
  };

  if (appLoading) {
    return (
      <div className="app-loading-screen">
        <h2>Loading ISELCONNECT...</h2>
      </div>
    );
  }

  // 3. Render the hidden dev route if the URL matches
  if (isDevRoute) {
    return <LinemanRegister onBack={() => window.location.href = "/"} />;
  }

  if (session && userRole) {
    if (userRole === 7) return <ResidentDashboard />;
    if (userRole === 9) return <LinemanDashboard />;
  }

  if (authView === "selection") {
    return (
      <RoleSelection
        onSelectResident={() => setAuthView("resident")}
        onSelectLineman={() => setAuthView("lineman")}
      />
    );
  }

  if (authView === "resident") {
    return <Auth onBack={() => setAuthView("selection")} />;
  }

  if (authView === "lineman") {
    return <LinemanAuth onBack={() => setAuthView("selection")} />;
  }

  return (
    <div className="app-restricted-screen">
      <h2>Access Restricted</h2>
      <p>Your account role cannot access this mobile portal.</p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="app-signout-btn"
      >
        Sign Out
      </button>
    </div>
  );
}

export default App;