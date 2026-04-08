import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './landingpage.css';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    // Determine the deep dark theme
    document.documentElement.setAttribute('data-theme', 'dark');

    // GSAP Animations Context for clean cleanup
    const ctx = gsap.context(() => {
      // Fade in and move up animations for general elements
      gsap.utils.toArray('.gsap-reveal').forEach((elem: any) => {
        gsap.fromTo(elem,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: elem,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
      // Optionally stagger cards in the How It Works
      gsap.from('.gsap-stagger-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.gsap-stagger-container',
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });
    }, containerRef);

    return () => ctx.revert(); // Cleanup GSAP
  }, []);

  return (
    <main ref={containerRef} className="relative min-h-screen bg-[#07070a] text-white font-sans tracking-wide overflow-x-hidden">
      {/* Background Lighting Layer - Restricted to top of page */}
      <div className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:5rem_5rem]"></div>

        {/* --- ELEGANT TOP-LEFT LIGHT RAYS --- */}
        {/* 1. Base Corner Ambient Glow */}
        <div className="absolute top-[-30%] left-[-20%] w-[60vw] h-[60vw] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none transform-gpu"></div>

        {/* 2. Ray 1 (Topmost thin ray) */}
        <div className="absolute top-[-20%] left-[-10%] w-[120vw] h-[15vh] bg-gradient-to-r from-indigo-300/10 to-transparent blur-[60px] rotate-[35deg] origin-top-left transform-gpu pointer-events-none"></div>

        {/* 3. Ray 2 (Core White Ray) */}
        <div className="absolute top-[0%] left-[-10%] w-[120vw] h-[25vh] bg-gradient-to-r from-white/15 to-transparent blur-[80px] rotate-[35deg] origin-top-left transform-gpu pointer-events-none"></div>

        {/* 4. Ray 3 (Bottom Indigo Ray) */}
        <div className="absolute top-[20%] left-[-10%] w-[120vw] h-[20vh] bg-gradient-to-r from-indigo-400/10 to-transparent blur-[70px] rotate-[35deg] origin-top-left transform-gpu pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <header className="absolute top-0 inset-x-0 z-50 flex justify-between items-center px-6 md:px-12 py-6 w-full box-border">
          {/* Logo */}
          <div className="text-white font-bold text-xl tracking-wide">
            Job Predicting
          </div>

          {/* Login Button */}
          <button onClick={handleLoginClick} className="px-6 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
            Login
          </button>
        </header>

        {/* 1. Hero Section */}
        <section className="relative min-h-screen pt-24 pb-20 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 text-center z-10">
          <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto mt-12 gap-8 gsap-reveal">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight drop-shadow-2xl font-sans tracking-tight">
              Bridging the Gap Between <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Education</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Employment</span> Through AI.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              In today’s competitive job market, students need data-driven, personalized career insights rather than generalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button onClick={handleLoginClick} className="px-8 py-3.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                Start Now
              </button>
              <button onClick={handleLoginClick} className="px-8 py-3.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-semibold transition-all">
                Explore Dashboard
              </button>
            </div>
          </div>

          {/* Mock Dashboard UI Graphic */}
          <div className="mt-12 mb-16 w-full max-w-6xl rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-md p-3 shadow-[0_20px_50px_rgba(168,85,247,0.3)] scale-[1.02] transform-gpu gsap-reveal">
            <div className="rounded-xl overflow-hidden bg-[#0a0a0f] border border-white/5 aspect-[16/9] md:aspect-[21/9] flex flex-col">
              {/* Fake Window Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0f1016]">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
              </div>
              {/* Fake Dashboard Body */}
              <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                {/* Background glow in dashboard */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="w-full md:w-1/3 flex flex-col gap-4 relative z-10">
                  <div className="h-28 rounded-xl bg-white/5 border border-white/5 p-5 flex flex-col justify-center gap-2">
                    <div className="w-1/2 h-3 rounded bg-white/20 mb-1"></div>
                    <div className="w-3/4 h-8 rounded bg-gradient-to-r from-purple-500/30 to-purple-500/5"></div>
                  </div>
                  <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-5 flex gap-3 flex-col">
                    <div className="w-full h-8 rounded bg-white/5"></div>
                    <div className="w-full h-8 rounded bg-white/5"></div>
                    <div className="w-full h-8 rounded bg-white/5"></div>
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col gap-4 relative z-10">
                  <div className="h-full rounded-xl bg-white/5 border border-white/5 p-6 flex flex-col">
                    <div className="w-1/4 h-3 rounded bg-white/20 mb-6"></div>
                    <div className="flex-1 flex items-end gap-3 md:gap-6 w-full pt-10 px-4">
                      <div className="flex-1 bg-gradient-to-t from-purple-600/20 to-purple-400/80 rounded-t-md relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">45%</div><div className="h-full w-full" style={{ height: '45%' }}></div></div>
                      <div className="flex-1 bg-gradient-to-t from-purple-600/30 to-purple-400/90 rounded-t-md relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">65%</div><div className="h-full w-full" style={{ height: '65%' }}></div></div>
                      <div className="flex-1 bg-gradient-to-t from-indigo-600/50 to-purple-400 border border-purple-400/40 rounded-t-md relative shadow-[0_0_20px_rgba(168,85,247,0.3)]"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-purple-300 font-bold">92%</div><div className="h-full w-full" style={{ height: '92%' }}></div></div>
                      <div className="flex-1 bg-gradient-to-t from-purple-600/20 to-purple-400/60 rounded-t-md relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">50%</div><div className="h-full w-full" style={{ height: '50%' }}></div></div>
                      <div className="flex-1 bg-gradient-to-t from-purple-600/10 to-purple-400/40 rounded-t-md relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">30%</div><div className="h-full w-full" style={{ height: '30%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. About Section - Bento Box Grid */}
        <section className="w-full py-24 sm:py-32 flex justify-center relative z-10">
          <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-14 text-center gsap-reveal w-full">The Problem & Solution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              {/* Card 1: Problem */}
              <div className="lg:col-span-1 p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex flex-col gap-5 gsap-reveal shadow-xl">
                <h3 className="text-2xl font-semibold text-white">The Problem We Solve</h3>
                <ul className="space-y-4 text-gray-400 text-base">
                  <li className="flex items-start gap-4">
                    <span className="text-red-400/80 bg-red-400/10 p-1.5 rounded-lg text-sm mt-0.5">⚠️</span>
                    <span>Students feel confused after graduation</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-red-400/80 bg-red-400/10 p-1.5 rounded-lg text-sm mt-0.5">⚠️</span>
                    <span>Decisions based on trends, not data</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-red-400/80 bg-red-400/10 p-1.5 rounded-lg text-sm mt-0.5">⚠️</span>
                    <span>Mismatch between education & employment</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-red-400/80 bg-red-400/10 p-1.5 rounded-lg text-sm mt-0.5">⚠️</span>
                    <span>Lack of clarity about skill gaps</span>
                  </li>
                </ul>
              </div>

              {/* Card 2 & 3 wrapper */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/30 to-indigo-900/10 backdrop-blur-xl border border-white/[0.08] gsap-reveal shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-700 pointer-events-none"></div>
                  <h3 className="text-2xl font-semibold text-white mb-4 relative z-10">Our AI Solution Pipeline</h3>
                  <p className="text-gray-300 mb-6 text-base relative z-10 flex items-center gap-2">
                    <span className="text-purple-400">⚡</span> Evaluates comprehensive datapoints:
                  </p>
                  <div className="flex flex-wrap gap-2.5 relative z-10">
                    {['Degree', 'CGPA', 'Internships', 'Certifications', 'Projects', 'Skills'].map(skill => (
                      <span key={skill} className="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 text-purple-200 border border-purple-500/20 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] relative overflow-hidden gsap-reveal shadow-xl">
                  <div className="relative z-10 w-full md:w-2/3">
                    <h3 className="text-2xl font-semibold text-white mb-4">The Output</h3>
                    <p className="text-gray-300 mb-5 text-base">Using a robust Random Forest model, we generate:</p>
                    <div className="space-y-4 text-gray-400">
                      <div className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                        <span className="text-[15px] font-medium text-gray-200">Ranked job role predictions</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400"></div>
                        </div>
                        <span className="text-[15px] font-medium text-gray-200">Confidence-based probability scores</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                        </div>
                        <span className="text-[15px] font-medium text-gray-200">Skill gap recommendations</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 w-1/3 h-full hidden md:flex items-end justify-end opacity-40 pointer-events-none p-6">
                    {/* SVG Chart Graphic */}
                    <svg className="w-full h-auto drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" viewBox="0 0 100 80">
                      <path d="M5 70 Q 25 50 45 60 T 90 10" fill="none" stroke="url(#paint0_linear)" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="90" cy="10" r="5" fill="#c084fc" />
                      <defs>
                        <linearGradient id="paint0_linear" x1="5" y1="70" x2="90" y2="10" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366f1" />
                          <stop offset="1" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="w-full py-24 sm:py-32 bg-[#07070a]/80 backdrop-blur-xl border-y border-white/[0.05] flex justify-center relative z-10">
          <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col items-center gsap-stagger-container">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 text-center gsap-reveal w-full">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full pb-4">
              {[
                { num: '01', title: 'Register & Login Securely', text: 'Create an account to securely save and access your progress.' },
                { num: '02', title: 'Enter Your Academic Details', text: 'Input degrees, skills, and past projects completely and accurately.' },
                { num: '03', title: 'AI Predicts Suitable Roles', text: 'Our ML pipeline processes profile factors simultaneously.' },
                { num: '04', title: 'View Confidence Scores', text: 'Discover multiple paths visualized clearly with distinct rankings.' },
                { num: '05', title: 'Improve with Feedback', text: 'Retrain constraints to make results even better continuously.' }
              ].map((step, idx) => (
                <div key={idx} className="relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:bg-white/[0.05] transition-colors overflow-hidden group w-full gsap-stagger-card">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-600 to-transparent opacity-70 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-5xl md:text-6xl font-black text-white/10 mb-6 inline-block font-sans tracking-tighter">{step.num}</div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Key Features - Infinite Marquee */}
        <section className="w-full py-24 sm:py-32 bg-[#0a0a0f] flex flex-col justify-center relative z-10 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-14 text-center gsap-reveal w-full">Key Features</h2>
          </div>

          {/* Full-bleed Marquee row */}
          <div className="w-full relative py-4">
            {/* Gradient fade borders */}
            <div className="absolute left-0 top-0 w-24 md:w-32 h-full bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-24 md:w-32 h-full bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none"></div>

            <div className="overflow-hidden flex w-full group">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex min-w-full shrink-0 items-center justify-around gap-6 animate-marquee group-hover:[animation-play-state:paused] px-3">
                  {[
                    'Secure Authentication (JWT & OAuth)',
                    'AI-Powered Job Role Prediction',
                    'Confidence Score Visualization',
                    'Skill Gap Analysis',
                    'Admin Dashboard & Model Management',
                    'Feedback-Based Continuous Improvement'
                  ].map((feature, idx) => (
                    <div key={idx} className="px-6 md:px-8 py-4 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md whitespace-nowrap text-gray-200 text-sm md:text-base font-medium hover:bg-white/[0.08] hover:border-purple-500/30 transition-all cursor-default shadow-sm flex items-center gap-3">
                      <span className="text-purple-400">✦</span> {feature}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Insights & Trending */}
        <section className="w-full py-24 sm:py-32 flex justify-center relative z-10">
          <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="p-10 md:p-14 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex flex-col justify-center gsap-reveal relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/20 transition-colors pointer-events-none"></div>
                <h2 className="text-3xl font-bold text-white mb-6 relative z-10 tracking-tight">Career Insights</h2>
                <p className="text-gray-400 leading-relaxed text-lg relative z-10">
                  The system displays confidence-based charts, ranked job roles, and skill-gap recommendations to help users make informed career decisions effectively.
                </p>
              </div>
              <div className="p-10 md:p-14 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl flex flex-col justify-center gsap-reveal shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Trending Paths</h2>
                <div className="flex flex-wrap gap-3.5">
                  {['AI/ML Engineer', 'Data Scientist', 'Data Analyst', 'Software Developer', 'Business Analyst'].map(role => (
                    <span key={role} className="px-5 py-2.5 rounded-full bg-[#111827] text-gray-200 border border-indigo-500/30 text-sm font-medium hover:bg-indigo-500/10 transition-colors cursor-default shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>{role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Powered By Node Graph */}
        <section className="w-full py-24 sm:py-32 flex justify-center relative z-10">
          <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col items-center text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#d1d5db] mb-20 tracking-tight gsap-reveal w-full">Powered By</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-14 relative w-full gsap-reveal">
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -translate-y-1/2 pointer-events-none"></div>

              <div className="flex md:flex-col gap-6 z-10 w-full md:w-auto overflow-x-auto scrollbar-hide p-2 snap-x">
                <div className="snap-center shrink-0 w-[200px] py-5 rounded-2xl bg-[#0e0f15] border border-white/[0.04] shadow-xl text-gray-300 text-base font-semibold transition-transform cursor-default">Frontend (React)</div>
                <div className="snap-center shrink-0 w-[200px] py-5 rounded-2xl bg-[#0e0f15] border border-white/[0.04] shadow-xl text-gray-300 text-base font-semibold transition-transform cursor-default">Backend (FastAPI)</div>
              </div>

              <div className="z-10 w-48 h-48 md:w-[280px] md:h-[280px] my-6 md:my-0 rounded-full bg-indigo-900/5 backdrop-blur-sm flex items-center justify-center shadow-[0_0_120px_rgba(88,28,135,0.7)] relative">
                <div className="absolute inset-0 rounded-full border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                <span className="font-extrabold text-[#d1d5db] text-center text-xl md:text-2xl font-sans tracking-tight">Random<br />Forest ML</span>
              </div>

              <div className="flex md:flex-col gap-6 z-10 w-full md:w-auto overflow-x-auto scrollbar-hide p-2 snap-x">
                <div className="snap-center shrink-0 w-[200px] py-5 rounded-2xl bg-[#0e0f15] border border-white/[0.04] shadow-xl text-gray-300 text-base font-semibold transition-transform cursor-default">Secure Auth</div>
                <div className="snap-center shrink-0 w-[200px] py-5 rounded-2xl bg-[#0e0f15] border border-white/[0.04] shadow-xl text-gray-300 text-base font-semibold transition-transform cursor-default">PostgreSQL</div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Bottom CTA & Footer */}
        <section className="w-full py-24 sm:py-32 flex justify-center relative z-10">
          <div className="w-full max-w-7xl px-6 md:px-12 flex flex-col items-center">
            <div className="rounded-[3rem] w-full bg-[#0c0d12] border border-white/[0.06] pt-24 pb-14 px-8 md:px-16 text-center relative overflow-hidden gsap-reveal shadow-2xl">
              {/* Subtle grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Ready to Discover Your Path?</h2>
              <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">
                Unlike traditional portals, we provide personalized, confidence-based career predictions to guide your long-term success.
              </p>
              <div className="flex flex-col sm:flex-row justify-center max-w-xl mx-auto gap-3 relative z-10">
                <input type="email" placeholder="Enter your email address" className="flex-1 rounded-full bg-white/[0.03] border border-white/[0.1] px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-colors" />
                <button onClick={handleLoginClick} className="rounded-full bg-white text-[#0a0a0f] font-bold px-10 py-4 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">Start Now</button>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full bg-[#08080c] py-10 px-6 text-center border-t border-white/[0.06] relative z-10">
          <p className="text-gray-600 text-sm font-medium tracking-wide">© 2026 Job Roles Prediction. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
};

export default LandingPage;
