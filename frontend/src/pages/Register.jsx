import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Activity, Mail, Lock, AlertTriangle, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function Register({ onLoginClick, isFirebaseConfigured }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isFirebaseConfigured) {
      setError("In demo mode, registration is not required. Please return to the login screen and sign in directly.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // App.jsx will detect auth state changes and redirect
    } catch (err) {
      console.error("Registration error:", err);
      // Map standard firebase errors to user friendly messages
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email address is already registered.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        case "auth/operation-not-allowed":
          setError("Email/password accounts are not enabled in Firebase Auth.");
          break;
        case "auth/weak-password":
          setError("The password is too weak.");
          break;
        default:
          setError(err.message || "Failed to create account. Please try again.");
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Oral Cancer Detection Portal</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="auth-error" style={{ marginBottom: "1.5rem", background: "rgba(225, 29, 72, 0.08)", borderColor: "rgba(225, 29, 72, 0.2)" }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, color: "var(--primary)" }} />
            <div style={{ color: "var(--text-main)" }}>
              <strong>Demo Mode:</strong> Firebase variables are not set. Registration is bypassed; please sign in directly.
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
                placeholder="Minimum 6 characters"
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">CONFIRM PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                id="confirm-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                Register <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button 
            onClick={onLoginClick} 
            className="auth-link"
            style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
          >
            Sign In here
          </button>
        </div>
      </motion.div>
    </div>
  );
}
