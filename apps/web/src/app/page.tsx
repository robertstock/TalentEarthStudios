"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Dashboard() {
  // SLIDER STATE
  const [price, setPrice] = useState(50);
  const [users, setUsers] = useState(1000);
  const [cost, setCost] = useState(5000);
  const [projects, setProjects] = useState(20);

  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState("/assets/iphone-app-demo.mp4"); // Default
  const [isVideoVertical, setIsVideoVertical] = useState(true); // Default to vertical
  const videoRef = useRef<HTMLVideoElement>(null);

  // DERIVED STATE
  const mrr = price * users;
  const projectRevenue = cost * projects;
  const projectProfit = projectRevenue * 0.5;
  const annualSub = mrr * 12;
  const annualProj = projectRevenue * 12;
  const combinedAnnual = annualSub + annualProj;
  const combinedMargin = annualSub + (projectProfit * 12);

  // FORMATTER
  const formatUSD = (num: number) => '$' + num.toLocaleString('en-US');
  const formatUSDDecimals = (num: number) => '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatNum = (num: number) => num.toLocaleString('en-US');

  // RESET
  const handleReset = () => {
    setPrice(50);
    setUsers(1000);
    setCost(5000);
    setProjects(20);
  };

  // VIDEO ACTIONS
  const handlePlay = (src: string, isVertical: boolean = true) => {
    setVideoSrc(src);
    setIsVideoVertical(isVertical);
    setIsModalOpen(true);
    // Wait for modal to render before attempting to play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load(); // Reload video with new src
        videoRef.current.play().catch(e => console.error("Play failed", e));
      }
    }, 100);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#030508] text-[#E2E8F0] font-sans flex flex-col">
      {/* HEADER */}
      {/* HEADER REMOVED: Using Global Layout Navbar */}
      <div className="pt-32"></div> {/* Spacer for fixed global navbar */}

      {/* MAIN CONTENT */}
      <main className="w-full flex justify-center p-4 md:p-8">
        <div className="w-full max-w-[1200px] bg-[#0B0F15] border border-[#1E2530] rounded-2xl p-4 md:p-8 flex flex-col gap-6 shadow-xl">
          <h1 className="text-2xl font-light text-[#E2E8F0]">Business Model</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* CARD 1: DEMO (MOVED TO LEFT) */}
            <div className="bg-[#11161F] border border-[#1E2530] rounded-xl p-6 flex flex-col gap-6 shadow-md md:col-span-1 lg:col-span-1">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-medium text-[#E2E8F0]">Demo</h2>
              </div>

              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Experience the platform in action. Watch the mobile app walkthrough or visit the live site.
              </p>

              <div className="flex flex-col gap-4 mt-auto">
                <button
                  onClick={() => handlePlay("/assets/intro.mov", false)}
                  className="w-full py-4 bg-[#E2E8F0] hover:bg-[#F8FAFC] text-black font-semibold rounded-md flex justify-center items-center gap-2 transition-colors shadow-sm"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </svg>
                  Intro Video
                </button>

                <button
                  onClick={() => handlePlay("/assets/iphone-app-demo.mp4", true)}
                  className="w-full py-4 bg-[#38BDF8] hover:bg-[#0EA5E9] text-black font-semibold rounded-md flex justify-center items-center gap-2 transition-colors"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play App Video
                </button>

                <Link
                  href="/website"
                  className="w-full py-4 bg-[#11161F] border border-[#1E2530] hover:bg-[#1a202c] hover:border-[#94A3B8] text-[#E2E8F0] rounded-md flex justify-center items-center gap-2 transition-all"
                >
                  <span>Open New Website</span>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* CARD 2: SUBSCRIPTION REVENUE */}
            <div className="bg-[#11161F] border border-[#1E2530] rounded-xl p-6 flex flex-col gap-6 shadow-md">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-medium text-[#E2E8F0]">
                  Subscription Revenue <span className="text-sm text-[#94A3B8] font-normal ml-2">(Optional)</span>
                </h2>
              </div>

              {/* Price Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm text-[#94A3B8]">
                  <span>Price per month</span>
                  <span className="text-[#E2E8F0] font-semibold">${price}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1E2530] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
              </div>

              {/* Users Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm text-[#94A3B8]">
                  <span>Active Users</span>
                  <span className="text-[#E2E8F0] font-semibold">{formatNum(users)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="50"
                  value={users}
                  onChange={(e) => setUsers(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1E2530] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
              </div>

              <div className="mt-auto pt-4 border-t border-[#1E2530] text-center">
                <div className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2">Monthly Recurring Revenue</div>
                <div className="text-4xl font-light text-[#E2E8F0] tracking-tight">{formatUSD(mrr)}</div>
                <div className="text-xs text-[#94A3B8] opacity-60 mt-2 italic">Assumes: Price x Users</div>
              </div>
            </div>

            {/* CARD 3: PROJECT REVENUE */}
            <div className="bg-[#11161F] border border-[#1E2530] rounded-xl p-6 flex flex-col gap-6 shadow-md">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-medium text-[#E2E8F0]">Project Revenue</h2>
              </div>

              {/* Cost Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm text-[#94A3B8]">
                  <span>Avg Project Cost</span>
                  <span className="text-[#E2E8F0] font-semibold">${formatNum(cost)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="100"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1E2530] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
              </div>

              {/* Projects Slider */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm text-[#94A3B8]">
                  <span>Projects / Month</span>
                  <span className="text-[#E2E8F0] font-semibold">{formatNum(projects)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={projects}
                  onChange={(e) => setProjects(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1E2530] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
              </div>

              <div className="mt-auto pt-4 border-t border-[#1E2530] text-center">
                <div className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2">Total Revenue</div>
                <div className="text-4xl font-light text-[#E2E8F0] tracking-tight">{formatUSD(projectRevenue)}</div>
                <div className="text-sm text-[#38BDF8] mt-1">Profit: {formatUSD(projectProfit)} (50%)</div>
                <div className="text-xs text-[#94A3B8] opacity-60 mt-2 italic">Revenue = Cost x Projects</div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#11161F] border border-[#1E2530] rounded-xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-md hover:border-[#38BDF8]/30 transition-colors group">
              <div className="text-lg font-medium text-[#94A3B8] group-hover:text-[#E2E8F0] transition-colors">Combined Annual Revenue</div>
              <div className="text-3xl font-light text-[#E2E8F0] tracking-tight">{formatUSDDecimals(combinedAnnual)}</div>
            </div>

            <div className="bg-[#11161F] border border-[#1E2530] rounded-xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-md hover:border-[#38BDF8]/30 transition-colors group">
              <div className="text-lg font-medium text-[#94A3B8] group-hover:text-[#E2E8F0] transition-colors">Combined Annual Margin</div>
              <div className="text-3xl font-light text-[#38BDF8] tracking-tight">{formatUSDDecimals(combinedMargin)}</div>
            </div>
          </div>

          {/* RESET BUTTON */}
          <div className="flex justify-start pt-2">
            <button
              onClick={handleReset}
              className="text-sm text-[#94A3B8] hover:text-[#E2E8F0] hover:underline bg-transparent border-none cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>

        </div>
      </main>

      {/* VIDEO MODAL */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-500 ease-out ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div
          className={`relative bg-transparent rounded-xl shadow-2xl transition-all duration-500 ease-out transform ${isModalOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'} ${isVideoVertical ? 'h-[85vh] w-auto aspect-[9/19.5]' : 'w-[90vw] max-w-6xl aspect-video h-auto'}`}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 md:top-0 md:-right-12 text-white/70 hover:text-white transition-colors duration-300 z-50 p-2 bg-black/50 md:bg-transparent rounded-full md:rounded-none backdrop-blur-sm md:backdrop-blur-none"
          >
            <i className="ph ph-x text-2xl md:text-3xl"></i>
          </button>

          <div className="w-full h-full rounded-xl overflow-hidden bg-black shadow-[0_0_50px_-12px_rgba(56,189,248,0.3)] border border-slate-800/50">
            <video
              ref={videoRef}
              controls
              className="w-full h-full object-cover"
              key={videoSrc} // Force re-render on source change
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

    </div>
  );
}
