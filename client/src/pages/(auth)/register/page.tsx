"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

const words = [
  { text: "Intelligence.", color: "text-blue-400" },
  { text: "Care.", color: "text-cyan-400" },
  { text: "Precision.", color: "text-indigo-400" },
  { text: "Compassion.", color: "text-sky-400" },
];

export default function RegisterPage() {
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // New state for post-Google password setup
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [backupPassword, setBackupPasswordState] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [index, setIndex] = useState(0);

  const { error, success } = useToast();
  const navigate = useNavigate();
  const { setBackupPassword } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "doctor") {
        error("Doctor accounts must be registered via the Practitioner Registry by an Admin.");
        return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: "patient", phoneNumber: phone, hasPassword: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create profile");
      }

      success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        error("This email is already registered. Please sign in instead.");
      } else {
        error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (role === "doctor") {
        error("Doctors must use clinical credentials.");
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      const me = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });

      if (!me.ok) {
        const user = result.user;
        const create = await fetch("/api/users/profile", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.displayName || "Patient",
            email: user.email,
            role: "patient",
            profilePhoto: user.photoURL,
            hasPassword: false,
          }),
        });
        if (!create.ok) {
          const err = await create.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Failed to create profile");
        }
        setShowPasswordSetup(true);
      } else {
        success("Existing account found. Welcome back!");
        const userData = (await me.json()) as { role?: string };
        if (userData.role === "admin") navigate("/admin");
        else if (userData.role === "doctor") navigate("/doctor-dashboard");
        else navigate("/dashboard");
      }
    } catch (err: any) {
        error(err.message || "Google signup failed");
    }
  };

  const handleSetBackupPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (backupPassword !== confirmPassword) {
          error("Passwords do not match.");
          return;
      }
      setLoading(true);
      try {
          await setBackupPassword(backupPassword);
          if (auth.currentUser) {
            const t = await auth.currentUser.getIdToken();
            await apiFetch("/api/me", {
              method: "PATCH",
              headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
              body: JSON.stringify({ hasPassword: true }),
            });
          }
          success("Backup password set! You can now login with email or Google.");
          navigate("/dashboard");
      } catch (err: any) {
          error(err.message || "Failed to set password");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex h-screen overflow-hidden">
        {/* Left Column: Visuals */}
        <div className="hidden lg:flex w-[55%] h-[calc(100vh-1rem)] relative overflow-hidden bg-slate-900 items-end justify-start p-20 m-2 rounded-[2.5rem] group">
            <div className="absolute inset-0 z-0">
                <img 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[10s] ease-linear animate-in fade-in duration-1000" 
                    src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop" 
                    alt="Modern Healthcare"
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
                    Connect with top-rated practitioners and manage your entire family's health journey from a single, intelligent sanctuary.
                </p>
            </div>
            
            <style>{`
                @keyframes authFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8 md:p-10 overflow-y-auto bg-white">
        <div className="w-full max-w-md md:space-y-4 space-y-3">
          
          {showPasswordSetup ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <div>
                <h2 className="font-headline font-bold text-2xl md:text-3xl text-on-surface tracking-tight mb-2">Secure Your Account</h2>
                <p className="text-on-surface-variant font-medium font-body leading-relaxed">We recommend setting a backup password so you can access your account even without Google.</p>
              </div>

              <form onSubmit={handleSetBackupPassword} className="space-y-4">
                <Input 
                    label="Backup Password"
                    placeholder="••••••••"
                    type="password"
                    required
                    minLength={8}
                    value={backupPassword}
                    onChange={(e) => setBackupPasswordState(e.target.value)}
                    icon="lock"
                />
                <Input 
                    label="Confirm Password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon="verified_user"
                />
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button variant="ghost" type="button" onClick={() => navigate("/dashboard")}>
                        Skip for now
                    </Button>
                    <Button isLoading={loading} type="submit" className="rounded-2xl">
                        Save Password
                    </Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <Link to="/" className="flex lg:hidden items-center justify-center gap-2 mb-4 group">
                <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">health_and_safety</span>
                <span className="text-2xl font-extrabold font-headline tracking-tighter text-primary">HealBook</span>
              </Link>

              <div className="text-center">
                <h2 className="font-headline font-bold text-2xl md:text-3xl text-on-surface tracking-tight mb-2">Create Account</h2>

              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface font-headline ml-1">Registration Type</label>
                  <div className="grid grid-cols-2 p-1 md:p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`py-2 md:py-3 text-xs font-black rounded-xl transition-all font-headline tracking-widest ${
                        role === "patient" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant opacity-60"
                      }`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("doctor")}
                      className={`py-2 md:py-3 text-xs font-black rounded-xl transition-all font-headline tracking-widest ${
                        role === "doctor" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant opacity-60"
                      }`}
                    >
                      Doctor
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="md:space-y-4 space-y-2">
                  <Input 
                    label="Full Name"
                    placeholder="Alex Johnson"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon="person"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-2">
                    <Input 
                      label="Email"
                      placeholder="alex@example.com"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon="mail"
                    />
                    <Input 
                      label="Phone"
                      placeholder="+91 98765 43210"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      icon="call"
                    />
                  </div>

                  <Input 
                    label="Create Password"
                    placeholder="Min. 8 characters"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon="lock"
                  />

                  <Button className="w-full py-3 md:py-4 text-base rounded-2xl shadow-xl shadow-primary/10" isLoading={loading} type="submit">
                    Register
                  </Button>
                </form>

                {role === "patient" && (
                  <>


                    <div className="grid gap-4">
                      <button 
                          onClick={handleGoogleSignup}
                          className="flex items-center justify-center gap-3 md:h-14 h-12 bg-white border border-outline-variant/30 rounded-2xl hover:bg-surface-container-low transition-all shadow-sm font-headline font-bold text-sm"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Continue with Google
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="mt-4 md:mt-6 text-center text-sm text-on-surface-variant font-body">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline font-headline">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
