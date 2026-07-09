import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Activity, Mail, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Login({ onRegisterClick, isFirebaseConfigured, onMockLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isFirebaseConfigured) {
      // Local demo mode fallback login
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (onMockLogin) {
          onMockLogin(email);
        }
      }, 800);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.jsx will detect auth state changes and redirect
    } catch (err) {
      console.error("Login error:", err);
      // Map standard firebase errors to user friendly messages
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;
        default:
          setError(err.message || "Failed to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Activity size={24} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Oral Cancer Detection Portal</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="auth-error" style={{ marginBottom: "1.5rem", background: "rgba(225, 29, 72, 0.08)", borderColor: "rgba(225, 29, 72, 0.2)" }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, color: "var(--primary)" }} />
            <div style={{ color: "var(--text-main)" }}>
              <strong>Demo Mode:</strong> Firebase variables are not set. You can sign in with any email and password for testing.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">EMAIL ADDRESS</label>
            <div style={{ position: "relative" }}>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                disabled={loading}
              />
              <Mail 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "1rem", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)" 
                }} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                disabled={loading}
              />
              <Lock 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "1rem", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)" 
                }} 
              />
            </div>
          </div>

          {error && (
            <motion.div 
              className="auth-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: "18px", height: "18px" }}></div>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <button 
            onClick={onRegisterClick} 
            className="auth-link"
            style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
          >
            Register here
          </button>
        </div>
      </motion.div>
    </div>
  );
}
