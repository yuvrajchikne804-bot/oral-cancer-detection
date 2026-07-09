import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbRM4oIfn0jAqbL0VTUHOed9S5M8aBa6A",
  authDomain: "yuvraj-login.firebaseapp.com",
  projectId: "yuvraj-login",
  storageBucket: "yuvraj-login.firebasestorage.app",
  messagingSenderId: "713705542452",
  appId: "1:713705542452:web:d2fc8210c3b0560f110b61",
  measurementId: "G-LVC5HNM5DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const isFirebaseConfigured = true;

export { auth, db, isFirebaseConfigured };
export default app;
