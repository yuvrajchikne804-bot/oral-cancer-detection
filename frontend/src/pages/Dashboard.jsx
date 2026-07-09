import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { 
  LogOut, Upload, FileImage, ShieldAlert, CheckCircle, 
  Clock, Trash2, HelpCircle, Activity, Image as ImageIcon, AlertCircle,
  Mic, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage, convertAudioToBase64 } from "../utils/mediaHelpers";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";
export default function Dashboard({ user, isFirebaseConfigured, mockLogout }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load history from Firestore (or localStorage fallback) on mount
  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    if (isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, "predictions"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const historyData = [];
        querySnapshot.forEach((doc) => {
          historyData.push({ id: doc.id, ...doc.data() });
        });
        setHistory(historyData);
      } catch (err) {
        console.error("Error fetching Firestore history:", err);
        // Fallback to local storage if Firestore rules or index fail
        loadLocalHistory();
      }
    } else {
      loadLocalHistory();
    }
  };

  const loadLocalHistory = () => {
    try {
      const stored = localStorage.getItem(`history_${user.uid || 'mock'}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
  };

  const saveHistoryItem = async (result, confidence, base64Thumb) => {
    const newItem = {
      userId: user.uid || "mock",
      userEmail: user.email,
      result: result,
      confidence: confidence,
      imageName: image ? image.name : "uploaded_image.jpg",
      imageThumb: base64Thumb || "", // small base64 thumbnail for preview
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, "predictions"), newItem);
        setHistory(prev => [{ id: docRef.id, ...newItem }, ...prev]);
        return;
      } catch (err) {
        console.error("Error saving to Firestore:", err);
      }
    }

    // Fallback/Local mode saving
    try {
      const localKey = `history_${user.uid || 'mock'}`;
      const stored = localStorage.getItem(localKey);
      const currentHistory = stored ? JSON.parse(stored) : [];
      const itemWithId = { id: `local_${Date.now()}`, ...newItem };
      const updatedHistory = [itemWithId, ...currentHistory];
      localStorage.setItem(localKey, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (e) {
      console.error("Failed to save history locally:", e);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear your prediction history?")) {
      if (isFirebaseConfigured) {
        try {
          const batch = writeBatch(db);
          history.forEach(item => {
            if (item.id && !item.id.startsWith("local_")) {
              const docRef = doc(db, "predictions", item.id);
              batch.delete(docRef);
            }
          });
          await batch.commit();
        } catch (err) {
          console.error("Error clearing Firestore history:", err);
        }
      }
      
      // Clear local
      try {
        localStorage.removeItem(`history_${user.uid || 'mock'}`);
      } catch (e) {}
      
      setHistory([]);
    }
  };

  // Helper to resize image to small base64 thumbnail for history
  const createThumbnail = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 80;
          const MAX_HEIGHT = 80;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (!selectedFile) return;
  // Use helper to compress image and get base64
  compressImage(selectedFile)
    .then((base64) => {
      setImage(selectedFile);
      setImageBase64(base64);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError("");
    })
    .catch((err) => {
      setError(err.message || "Failed to process image");
    });
};

  const processSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, JPEG).");
      return;
    }

    // Limit to 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image file size should be less than 10MB.");
      return;
    }

    setImage(selectedFile);
    setImageBase64("");
    setError("");
    setPrediction(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    processSelectedFile(droppedFile);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handlePredict = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      // Connect to Flask backend on port 5000
      const response = await axios.post(`${BACKEND_URL}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data && response.data.success) {
        const { result, confidence } = response.data;
        setPrediction({ result, confidence });
        
        // Generate a thumbnail and save to history database
        const thumb = await createThumbnail(image);
        await saveHistoryItem(result, confidence, thumb);
      } else {
        throw new Error(response.data.error || "Prediction request failed.");
      }
    } catch (err) {
      console.error("Prediction request error:", err);
      let errMsg = "Unable to connect to Flask server. Please make sure the Flask backend is running on http://127.0.0.1:5000.";
      if (err.response && err.response.data && err.response.data.error) {
        errMsg = err.response.data.error;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    } else {
      mockLogout();
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <a href="#" className="nav-brand">
          <Activity size={24} />
          Oral<span>Cancer</span>Guard
        </a>
        <div className="nav-user">
          <span className="user-email">{user.email}</span>
          <button onClick={handleLogout} className="btn btn-danger-outline" style={{ padding: "0.5rem 1rem" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {!isFirebaseConfigured && (
        <div className="config-warning-banner">
          <div className="config-warning-content">
            <AlertCircle size={20} />
            <span>
              <strong>Local Mode Enabled:</strong> Firebase variables are not set. Auth and database features are running in demo mode (history is stored locally in your browser). Flask model predictions are fully active.
            </span>
          </div>
        </div>
      )}

      <main className="dashboard-container">
        {/* Left Side: Upload and Prediction Panel */}
        <section className="panel-card">
          <h2 className="panel-title">
            <Activity size={20} className="dropzone-icon" /> Oral Lesion Diagnostic Tool
          </h2>
          
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Upload a clear, high-resolution close-up photo of the tongue or oral cavity lesion. 
            The system will analyze the tissue structure and output a diagnostic evaluation.
          </p>

          {/* Upload Dropzone / Select */}
          <div 
            className={`dropzone ${dragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: "none" }}
            />
            <Upload size={36} className="dropzone-icon" />
            <div className="dropzone-text">
              <span>Click to upload</span> or drag and drop image here
            </div>
            <div className="dropzone-subtext">Supports PNG, JPG, JPEG (Max 10MB)</div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Image Preview & Inference Loading */}
          {previewUrl && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="preview-container">
                <img src={previewUrl} alt="Patient oral cavity preview" className="preview-image" />
                
                {/* Scanner pulse animation */}
                {loading && <div className="scanner-line"></div>}

                {/* Overlay loading box */}
                {loading && (
                  <div className="prediction-loading-overlay">
                    <div className="spinner"></div>
                    <span className="prediction-loading-text">Analyzing Tissue...</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  onClick={handlePredict} 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: "48px" }}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Run Analysis"}
                </button>
                <button 
                  onClick={() => {
                    setImage(null);
                    setPreviewUrl("");
                    setPrediction(null);
                    setError("");
                  }} 
                  className="btn btn-outline" 
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Results Diagnostic Report Box */}
          <AnimatePresence>
            {prediction && (
              <motion.div 
                className={`result-box ${prediction.result === "Cancer Detected" ? "detected" : "negative"}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <div className="result-header">
                  <span className="result-badge">
                    {prediction.result === "Cancer Detected" ? (
                      <>
                        <ShieldAlert size={18} /> High Risk: Positive
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} /> Low Risk: Negative
                      </>
                    )}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Diagnostic Result</span>
                  </div>
                </div>

                <div className="result-confidence-wrapper">
                  <div className="confidence-header">
                    <span>Classification Confidence</span>
                    <span>{prediction.confidence}%</span>
                  </div>
                  <div className="confidence-bar-bg">
                    <motion.div 
                      className="confidence-bar-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${prediction.confidence}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <p className="result-message">
                  {prediction.result === "Cancer Detected" ? (
                    <>
                      <strong>WARNING:</strong> Anomalo-tissue anomalies resembling Oral Squamous Cell Carcinoma (OSCC) detected. Immediate specialist consultation (oral surgeon or oncologist) is strongly recommended for a biopsy. This is an AI-assisted evaluation and does not replace medical diagnostics.
                    </>
                  ) : (
                    <>
                      <strong>DIAGNOSIS:</strong> No indicators of malignancy or oral cancer detected in the uploaded tissue sample. Maintain standard oral hygiene. If you feel pain, persistent swelling, or notices anomalies lasting over 14 days, please see an oral care specialist.
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Side: Prediction History Panel */}
        <section className="panel-card" style={{ height: "fit-content" }}>
          <div className="panel-title" style={{ justifyContent: "space-between", width: "100%" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} className="dropzone-icon" /> Diagnostic History
            </span>
            {history.length > 0 && (
              <button 
                onClick={handleClearHistory} 
                className="btn btn-outline" 
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", gap: "0.25rem", color: "var(--text-dim)" }}
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">
                <ImageIcon size={32} />
                <div>No previous evaluations</div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  Diagnostic records will appear here as they are processed.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {item.imageThumb ? (
                      <img src={item.imageThumb} alt="History thumbnail" className="history-item-image" />
                    ) : (
                      <div className="history-item-image" style={{ display: "flex", alignItems: "center", justify: "center", background: "#1a1a24" }}>
                        <FileImage size={18} style={{ color: "var(--text-dim)" }} />
                      </div>
                    )}
                    <div className="history-info">
                      <span className={`history-status ${item.result === "Cancer Detected" ? "detected" : "negative"}`}>
                        {item.result}
                      </span>
                      <span className="history-meta">
                        <span>Conf: {item.confidence}%</span>
                        <span>•</span>
                        <span>{formatDate(item.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
