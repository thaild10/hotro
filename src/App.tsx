import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import KanbanApp from "./components/KanbanApp";
import { AppData, DEFAULT_TAGS } from "./types";

export default function App() {
  const [username, setUsername] = useState<string | null>(localStorage.getItem("app_auth_user"));
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load & Polling
  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/data/get");
        if (!res.ok) throw new Error("Không thể kết nối đến máy chủ dữ liệu");
        const data = await res.json();
        if (data) {
          setAppData(data);
        } else {
          setAppData({ cards: [], tagsConfig: DEFAULT_TAGS });
        }
        setError(null);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Lỗi tải dữ liệu");
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

  if (error && !appData && username) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-rose-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-rose-100">
          <h2 className="text-xl font-black text-rose-500 mb-4">Lỗi Kết Nối Dữ Liệu</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-rose-500 text-white font-bold py-3 rounded-2xl active:scale-95 transition-all"
          >
            Thử tải lại trang
          </button>
        </div>
      </div>
    );
  }

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
