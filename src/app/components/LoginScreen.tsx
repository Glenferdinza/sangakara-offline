"use client";

import { useState, useEffect, Fragment } from "react";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import logoKemendikti from "../../imports/kemendikti.svg";
import logoDiktisaintek from "../../imports/diktisaintek.svg";
import logo2045 from "../../imports/2045.svg";
import logoLIDM from "../../imports/lidm.svg";
import logoUNY from "../../imports/uny.svg";
import logoSangkara from "../../imports/sangkara.svg";
import logoSangkaraLogo from "../../imports/sangkara-logo.svg";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loadingStep, setLoadingStep] = useState<"center" | "moving" | "done">("center");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Timeline untuk animasi logo
  useEffect(() => {
    // 1. Tampilkan logo di tengah (center) selama 2 detik
    const timer1 = setTimeout(() => {
      setLoadingStep("moving");
    }, 2000);

    // 2. Geser ke atas (done/top-center) setelah transisi geser selesai (1.0 detik)
    const timer2 = setTimeout(() => {
      setLoadingStep("done");
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    setTimeout(() => {
      if (username === "sangkaraadmin" && password === "sangkaraadmin123") {
        onLoginSuccess();
      } else {
        setError("Kredensial salah! Periksa nama pengguna dan kata sandi.");
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const logos = [
    { src: logoKemendikti, alt: "Kemendikti", className: "" },
    { src: logoDiktisaintek, alt: "Diktisaintek", className: "" },
    { src: logo2045, alt: "Indonesia Emas 2045", className: "" },
    { src: logoLIDM, alt: "LIDM", className: "" },
    { src: logoUNY, alt: "UNY", className: "" },
    { src: logoSangkara, alt: "Sangkara", className: "hidden md:block" },
    { src: logoSangkaraLogo, alt: "Sangkara Logo", className: "block md:hidden" },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-[#f0f7ff] via-[#f8fafc] to-[#eef2ff] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decorative Rings/Blur elements */}
      <div className="absolute w-[500px] h-[500px] bg-sky-400/20 rounded-full blur-[120px] -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[140px] -bottom-40 -right-40 pointer-events-none" />

      {/* CONTAINER LOGO DENGAN ANIMASI TRANSISI RESPONSIF (TOP NAVBAR / CAPSULE) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center flex-wrap z-20 transition-all duration-[1000ms] cubic-bezier(0.25, 1, 0.5, 1) ${
          loadingStep === "center"
            ? "top-1/2 -translate-y-1/2 w-[95%] md:w-max max-w-md md:max-w-none px-4 py-5 md:px-8 md:py-3 bg-transparent border-transparent shadow-none backdrop-blur-none rounded-none gap-4 md:gap-5 lg:gap-6"
            : "top-0 md:top-10 -translate-y-0 w-full md:w-max max-w-none md:max-w-none px-6 py-4 md:px-8 md:py-3 bg-white/90 md:bg-white border-b md:border border-slate-200/80 md:border-slate-200/50 shadow-[0_2px_15px_rgba(30,58,95,0.04)] md:shadow-[0_8px_30px_rgba(30,58,95,0.03)] backdrop-blur-md md:backdrop-blur-sm rounded-none md:rounded-full gap-4 md:gap-5 lg:gap-6"
        }`}
      >
        {logos.map((logo, idx) => (
          <Fragment key={idx}>
            <img
              src={typeof logo.src === "string" ? logo.src : logo.src.src}
              alt={logo.alt}
              className={`w-auto object-contain transition-all duration-[1000ms] cubic-bezier(0.25, 1, 0.5, 1) ${logo.className} ${
                logo.alt === "LIDM"
                  ? loadingStep === "center"
                    ? "h-14 md:h-20 lg:h-28 mx-6 drop-shadow-[0_4px_12px_rgba(30,58,95,0.03)]"
                    : "h-10 sm:h-12 md:h-14 mx-6"
                  : loadingStep === "center"
                    ? "h-8 md:h-12 lg:h-16 drop-shadow-[0_4px_12px_rgba(30,58,95,0.03)]"
                    : "h-6 sm:h-7 md:h-8"
              } animate-fade-in`}
              style={{
                animationDelay: `${idx * 120}ms`,
                animationFillMode: "both",
              }}
            />
            {idx === 3 && (
              <div
                className={`h-0 overflow-hidden md:hidden transition-all duration-[1000ms] cubic-bezier(0.25, 1, 0.5, 1) ${
                  loadingStep === "center"
                    ? "w-full basis-full opacity-100"
                    : "w-0 basis-0 opacity-0 pointer-events-none"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* FORM LOGIN DENGAN EFEK GLASSMORPHISM (LIGHT THEME) */}
      <div
        className={`w-full max-w-[420px] z-10 transition-all duration-[800ms] cubic-bezier(0.25, 1, 0.5, 1) mt-24 sm:mt-28 md:mt-32 ${
          loadingStep === "done"
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-12 pointer-events-none"
        }`}
      >
        <div className="bg-white/85 border border-white/60 rounded-[32px] p-8 sm:p-10 shadow-[0_24px_70px_rgba(30,58,95,0.06)] backdrop-blur-xl">
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-slate-800 tracking-wide">
              Login Dashboard
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              Masuk untuk mengelola sistem SANGKARA
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-bold tracking-wide block">
                Nama Pengguna
              </label>
              <div className="relative rounded-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400/80" />
                </div>
                <input
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/70 border border-slate-200/80 pl-11 pr-4 py-3.5 rounded-2xl text-sm text-slate-900 placeholder-slate-400/90 focus:outline-none focus:bg-white focus:border-[#1E3A5F]/50 focus:ring-4 focus:ring-blue-50/50 transition duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-bold tracking-wide block">
                Kata Sandi
              </label>
              <div className="relative rounded-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400/80" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/70 border border-slate-200/80 pl-11 pr-12 py-3.5 rounded-2xl text-sm text-slate-900 placeholder-slate-400/90 focus:outline-none focus:bg-white focus:border-[#1E3A5F]/50 focus:ring-4 focus:ring-blue-50/50 transition duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium mt-1.5 pl-1 animate-fade-in">
                {error}
              </p>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-[#F5A623] hover:bg-[#e0941d] disabled:bg-[#F5A623]/50 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#F5A623]/10 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Tambahan style CSS untuk keyframe fade-in di component */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
