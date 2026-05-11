import React, { useState } from "react";
import { 
  LockKeyhole, 
  User, 
  Eye, 
  EyeOff, 
  CircleAlert 
} from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đủ Email và Mật khẩu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Extract username from email to display in app
      const username = userCredential.user.email?.split('@')[0] || "User";
      onLoginSuccess(username);
    } catch (err: any) {
      console.error(err);
      setError("Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-pastel-bg flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl shadow-rose-100 border border-pastel-border flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 border border-rose-100">
          <LockKeyhole className="w-10 h-10 text-rose-400" />
        </div>
        
        <h2 className="text-2xl font-bold mb-8">Đăng nhập</h2>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-subtext w-5 h-5" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-pastel-bg rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-rose-200 transition-all" 
              placeholder="Email" 
            />
          </div>

          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-pastel-subtext w-5 h-5" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pastel-bg rounded-2xl py-4 pl-12 pr-12 text-sm font-bold outline-none border border-transparent focus:border-rose-200 transition-all" 
              placeholder="Mật khẩu" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-pastel-subtext p-1 active:text-rose-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-rose-400 py-4 rounded-2xl text-white font-black text-sm shadow-lg shadow-rose-200 active:scale-95 transition-transform",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 w-full"
            >
              <div className="flex items-center gap-2 bg-rose-50 text-rose-500 p-3 rounded-xl text-xs font-bold border border-rose-100">
                <CircleAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
