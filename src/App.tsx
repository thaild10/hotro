import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./components/Login";
import KanbanApp from "./components/KanbanApp";
import { AppData, DEFAULT_TAGS } from "./types";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [username, setUsername] = useState<string | null>(localStorage.getItem("app_auth_user"));
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch data from Firestore
        const storedUsername = localStorage.getItem("app_auth_user");
        if (storedUsername) {
          await loadUserData(storedUsername);
        }
      } else {
        setAppData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (username: string) => {
    try {
      const docRef = doc(db, "appdata", username);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAppData(docSnap.data() as AppData);
      } else {
        // Initial data
        const initialData: AppData = {
          cards: [],
          tagsConfig: DEFAULT_TAGS,
        };
        setAppData(initialData);
        await setDoc(docRef, initialData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleLoginSuccess = async (newUsername: string) => {
    localStorage.setItem("app_auth_user", newUsername);
    setUsername(newUsername);
    await loadUserData(newUsername);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("app_auth_user");
    setUsername(null);
    setUser(null);
    setAppData(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-pastel-bg">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !username) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <KanbanApp 
      username={username}
      initialData={appData || { cards: [], tagsConfig: DEFAULT_TAGS }}
      onLogout={handleLogout}
    />
  );
}
