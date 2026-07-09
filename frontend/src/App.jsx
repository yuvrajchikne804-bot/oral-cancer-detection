import React, { useState, useEffect } from "react";
import { auth, isFirebaseConfigured } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Activity } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login"); // "login" | "register" | "dashboard"

  // Check if Firebase configuration is set and valid
  useEffect(() => {
    if (isFirebaseConfigured) {
      // Firebase is configured, listen to real auth changes
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          setView("dashboard");
        } else {
          setCurrentUser(null);
          // If we were on dashboard and logged out, go back to login
          setView((prev) => (prev === "dashboard" ? "login" : prev));
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Running in Mock/Local fallback mode
      console.warn("Firebase credentials are not configured. Running in Local Mock Mode.");
      
      // Load any mock session
      try {
        const storedMockUser = sessionStorage.getItem("mock_user");
        if (storedMockUser) {
          setCurrentUser(JSON.parse(storedMockUser));
          setView("dashboard");
        }
      } catch (e) {}
      
      setLoading(false);
    }
  }, []);

  // Handlers for Mock/Local mode
  const handleMockLogin = (email) => {
    const mockUser = { email, uid: "mock_doctor_user_123" };
    setCurrentUser(mockUser);
    sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
    setView("dashboard");
  };

  const handleMockLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("mock_user");
    setView("login");
  };

  // Render global loading spinner on mount
  if (loading) {
    return (
      <div className="global-loader">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "4px" }}></div>
        <div className="global-loader-text">Loading oral-cancer diagnostics...</div>
      </div>
    );
  }

  // Define component views based on auth state and view setting
  return (
    <>
      {view === "login" && (
        <Login 
          onRegisterClick={() => setView("register")}
          isFirebaseConfigured={isFirebaseConfigured}
          // Pass mock login handler in case Firebase is unconfigured
          onMockLogin={handleMockLogin}
        />
      )}
      
      {view === "register" && (
        <Register 
          onLoginClick={() => setView("login")}
          isFirebaseConfigured={isFirebaseConfigured}
        />
      )}
      
      {view === "dashboard" && currentUser && (
        <Dashboard 
          user={currentUser}
          isFirebaseConfigured={isFirebaseConfigured}
          mockLogout={handleMockLogout}
        />
      )}
    </>
  );
}
