import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
/* import { useRouter } from "next/router"; */

import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  /* const router = useRouter(); */
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const particleCount = 60;
  const particles = Array.from({ length: particleCount });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white relative overflow-hidden">

      {/* Moving Particles */}
      {particles.map((_, idx) => {
        const size = 4 + Math.random() * 10;
        const speed = 2 + Math.random() * 3;
        const offsetX = Math.random() * window.innerWidth;
        const offsetY = Math.random() * window.innerHeight;

        return (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-purple-500/60 shadow-[0_0_20px_rgba(255,0,255,0.5)]"
            style={{ width: size, height: size }}
            animate={{
              x: mousePos.x + offsetX * Math.cos((performance.now() / 1000) / speed),
              y: mousePos.y + offsetY * Math.sin((performance.now() / 1000) / speed),
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{ repeat: Infinity, repeatType: "loop", duration: 3 + Math.random() * 3 }}
          />
        );
      })}

      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto relative z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          AIWebForge
        </h1>
        {/* <button
          className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg hover:scale-105 transition"
          onClick={() => navigate("/login)}
        >
          Login
        </button> */}
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between px-6 lg:px-20 py-20 max-w-7xl mx-auto z-10">
        <div className="max-w-xl text-center lg:text-left order-2 lg:order-1">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl lg:text-6xl font-extrabold leading-tight"
          >
            Build <span className="text-purple-500">Full-Stack Apps</span> <br />
            Without Writing Code
          </motion.h2>
          <p className="mt-6 text-gray-400 text-lg">
            AIWebForge allows founders and creators to design, generate, and deploy full-stack applications with AI-assisted code generation.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => navigate("/build")}
              className="px-10 py-5 text-lg bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition"
            >
              Start Building
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center order-1 lg:order-2 min-h-[500px]">
          <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute w-64 h-64 rounded-full border border-purple-400/30 animate-spin-slow"></div>
          <div className="absolute w-80 h-80 rounded-full border-2 border-violet-400/40 animate-spin-reverse"></div>

          <div className="relative z-10 backdrop-blur-xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-xl p-6 w-80 animate-float shadow-lg">
            <p className="text-xs text-violet-400 mb-3">AI System Logs</p>
            <div className="space-y-2 text-xs font-mono">
              <div className="text-emerald-400">[✓] Drag & Drop Layout Ready</div>
              <div className="text-cyan-400">[~] AI Backend Generation...</div>
              <div className="text-purple-400 animate-pulse">[⚡] 3D Website Modules Loading...</div>
            </div>
          </div>

          <style jsx>{`
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin-slow 18s linear infinite; }
            @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            .animate-spin-reverse { animation: spin-reverse 28s linear infinite; }
            @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
            .animate-float { animation: float 6s ease-in-out infinite; }
          `}</style>
        </div>
      </section>
    </div>
  );
}
