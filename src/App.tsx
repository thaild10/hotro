import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const storedUsername = localStorage.getItem("app_auth_user");
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } else {
        setAppData(null);
        setUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time data sync using custom API
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        // If data is empty, initialize with defaults
        if (Object.keys(data).length === 0) {
          const initialData: AppData = {
            cards: [],
            tagsConfig: DEFAULT_TAGS,
          };
          setAppData(initialData);
        } else {
          setAppData(data as AppData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // Poll every 10 seconds for shared updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (newUsername: string) => {
    localStorage.setItem("app_auth_user", newUsername);
    setUsername(newUsername);
    // Data sync is handled by the useEffect above
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("app_auth_user");
    setUsername(null);
    setUser(null);
    setAppData(null);
  };

  if (loading || (user && !appData)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-pastel-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
          <div className="text-rose-400 font-bold text-sm">Đang đồng bộ dữ liệu...</div>
        </div>
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
