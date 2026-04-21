"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

const words = [
  { text: "Intelligence.", color: "text-blue-400" },
  { text: "Care.", color: "text-cyan-400" },
  { text: "Precision.", color: "text-indigo-400" },
  { text: "Compassion.", color: "text-sky-400" },
];

export default function LoginPage() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { error, success } = useToast();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const userData = (await res.json()) as { role?: string };
        if (userData.role === "admin") navigate("/admin");
        else if (userData.role === "doctor") navigate("/doctor-dashboard");
        else navigate("/dashboard");
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Backend login error:", errorData);
        if (res.status === 502) {
          error("Server side error (502). The backend may have crashed.");
        } else if (res.status === 503) {
          error(`Service Unavailable: ${errorData.message || "The backend is not configured correctly."}`);
        } else {
          error(errorData.error || errorData.message || "Profile synchronization failed. Redirecting to dashboard...");
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      }
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      if (err.code === "auth/invalid-credential" && email) {
          error("Invalid credentials. If you signed up with Google, please use 'Forgot Password' to set a backup login.");
      } else {
          error(err.message || "Failed to login");
      }
    } finally {

      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (role === "doctor") {
        error("Doctors must use clinical credentials.");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const userData = (await res.json()) as { role?: string };
        if (userData.role === "admin") navigate("/admin");
        else if (userData.role === "doctor") navigate("/doctor-dashboard");
        else navigate("/dashboard");
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Backend Google login error:", errorData);
        if (res.status === 502) {
          error("Server side error (502). The backend may have crashed.");
        } else if (res.status === 503) {
          error(`Service Unavailable: ${errorData.message || "The backend is not configured correctly."}`);
        } else {
          error(errorData.error || errorData.message || "Profile synchronization failed. Redirecting to dashboard...");
          setTimeout(() => navigate("/dashboard"), 2000);
        }
      }
    } catch (err: any) {
        console.error("Google login failed:", err);
        error(err.message || "Google login failed");
    }

  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Column: Visuals */}
      <div className="hidden lg:flex w-[55%] h-[calc(100vh-1rem)] relative overflow-hidden bg-slate-900 items-end justify-start p-20 m-2 rounded-[2.5rem] group">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s] ease-linear animate-in fade-in duration-1000" 
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop" 
            alt="Clinic Interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        </div>

        {/* Floating Logo for Desktop */}
        <Link to="/" className="absolute top-12 left-12 flex items-center gap-2 group z-20 bg-slate-950/20 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 px-6">
          <span className="material-symbols-outlined text-blue-400 text-3xl group-hover:scale-110 transition-transform">health_and_safety</span>
          <span className="text-2xl font-extrabold font-headline tracking-tighter text-white">HealBook</span>
        </Link>

        <div className="relative z-10 max-w-2xl">
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-white leading-[1.1] mb-6 tracking-tighter">
            Healthcare, <br/>Simplified with <br/>
            <span 
              className={`inline-block transition-all duration-700 ease-in-out ${words[index].color}`}
              key={words[index].text}
              style={{
                animation: "authFadeIn 0.8s ease-out forwards"
              }}
            >
              {words[index].text}
            </span>
          </h1>
          <p className="text-white/60 text-lg font-medium font-body leading-relaxed max-w-md">
            Join thousands of patients and healthcare providers in a modern, secure, and seamless digital health ecosystem.
          </p>
        </div>

        <style jsx>{`
            @keyframes authFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-10 md:p-12 overflow-y-auto bg-white">
        <div className="w-full max-w-md md:space-y-6 space-y-3">
          <Link to="/" className="flex lg:hidden items-center justify-center gap-2 mb-4 group">
            <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">health_and_safety</span>
            <span className="text-2xl font-extrabold font-headline tracking-tighter text-primary">HealBook</span>
          </Link>

          <div className="text-center">
             <h2 className="font-headline font-bold text-2xl md:text-3xl text-on-surface tracking-tight mb-2">Welcome Back</h2>

          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface font-headline ml-1">Portal Type</label>
              <div className="grid grid-cols-2 p-1 md:p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-inner">
                <button
                  onClick={() => setRole("patient")}
                  className={`py-2 md:py-3 text-xs font-black rounded-xl transition-all font-headline tracking-widest ${
                    role === "patient" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant opacity-60"
                  }`}
                >
                  Patient
                </button>
                <button
                  onClick={() => setRole("doctor")}
                  className={`py-2 md:py-3 text-xs font-black rounded-xl transition-all font-headline tracking-widest ${
                    role === "doctor" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant opacity-60"
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="md:space-y-4 space-y-3">
              <Input 
                label="Email Address"
                placeholder="alex@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon="mail"
              />
              <Input 
                label="Password"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon="lock"
              />

              <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline font-headline">
                      Forgot password?
                  </Link>
              </div>

              <Button className="w-full py-3 md:py-4 text-base rounded-2xl shadow-xl shadow-primary/10" isLoading={loading} type="submit">
                Sign In
              </Button>
            </form>

            {role === "patient" && (
              <>


                <div className="grid gap-4">
                  <button 
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center gap-3 md:h-14 h-12 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-all shadow-sm font-headline font-bold text-sm"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Sign in with Google
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="mt-4 md:mt-8 text-center text-sm text-on-surface-variant font-body">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-bold hover:underline font-headline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
