import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import KanbanApp from "./components/KanbanApp";
import { AppData, DEFAULT_TAGS } from "./types";

export default function App() {
  const [username, setUsername] = useState<string | null>(localStorage.getItem("app_auth_user"));
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load & Polling
  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/data/get");
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        if (data) {
          setAppData(data);
        } else {
          setAppData({ cards: [], tagsConfig: DEFAULT_TAGS });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Polling every 30 seconds for shared updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [username]);

  const handleLoginSuccess = (newUsername: string) => {
    localStorage.setItem("app_auth_user", newUsername);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem("app_auth_user");
    setUsername(null);
    setAppData(null);
  };

  if (loading || (username && !appData)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-pastel-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin"></div>
          <div className="text-rose-400 font-bold text-sm">Đang đồng bộ dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (!username) {
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
