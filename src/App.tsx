import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, FileText, Rss, Map as MapIcon, Settings,
  Search, Bell, CheckCircle2, Clock, BarChart3,
  Sun, MessageSquare, Wrench, Trash2, AlertTriangle,
  Droplets, Car, Lightbulb, Waves, Trees, MoreHorizontal,
  ChevronRight, ArrowRight, ArrowLeft, BookOpen, MapPin,
  Image as ImageIcon, Check, Sparkles, X, Globe
} from 'lucide-react';

const CATEGORIES = [
  { id: 'roads', label: 'Roads & Transport', icon: Car },
  { id: 'lights', label: 'Street Lights', icon: Lightbulb },
  { id: 'garbage', label: 'Garbage & Cleanliness', icon: Trash2 },
  { id: 'water', label: 'Water Supply', icon: Droplets },
  { id: 'sewage', label: 'Sewage & Drainage', icon: Waves },
  { id: 'parks', label: 'Parks & Public Spaces', icon: Trees },
  { id: 'others', label: 'Others', icon: MoreHorizontal },
];

export default function App() {
  // New State: Language Toggle
  const [lang, setLang] = useState('EN');
  
  // Interactive Notebook State
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for back
  const [selectedCategory, setSelectedCategory] = useState('Roads & Transport');
  const [location, setLocation] = useState('Sector 17, Near City Park, Bhopal, MP');
  const [description, setDescription] = useState('Large pothole on the main road causing difficulty for vehicles.');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const openNotebookWithCategory = (catLabel?: string) => {
    if (catLabel) setSelectedCategory(catLabel);
    setIsSubmitted(false);
    setCurrentPage(1);
    setIsNotebookOpen(true);
  };

  const nextPage = () => {
    setDirection(1);
    setCurrentPage((p) => p + 1);
  };

  const prevPage = () => {
    setDirection(-1);
    setCurrentPage((p) => p - 1);
  };

  // Framer Motion Page Variants
  const pageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: (dir: number) => ({ x: dir < 0 ? 30 : -30, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } })
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1e1b18] text-white flex p-5 gap-6 select-none">
      
      {/* WARM SUNLIT WOOD DESK BACKGROUND */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2400&auto=format&fit=crop')`,
          filter: 'brightness(0.65) contrast(1.08) saturate(0.95)'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(255,228,181,0.22),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/20 to-amber-950/30 pointer-events-none" />

      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="relative z-10 w-[230px] shrink-0 h-full flex flex-col justify-between rounded-[28px] bg-black/25 backdrop-blur-2xl border border-white/15 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-3.5 px-2 pt-1 mb-9">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <BookOpen size={20} className="text-amber-100" />
            </div>
            <div className="font-serif-display leading-tight">
              <span className="block text-lg font-semibold tracking-wide text-white">Call for</span>
              <span className="block text-lg font-semibold tracking-wide text-white/90">Resolve</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { icon: Home, label: 'Home', active: true },
              { icon: FileText, label: 'My Reports' },
              { icon: Rss, label: 'City Feed' },
              { icon: MapIcon, label: 'Map View' },
              { icon: Settings, label: 'Settings' },
            ].map((item, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm transition-all duration-200 cursor-pointer ${
                  item.active
                    ? 'bg-gradient-to-r from-indigo-500/35 to-purple-500/20 border border-indigo-300/30 text-white font-medium shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                    : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <item.icon size={18} className={item.active ? 'text-indigo-200' : 'text-white/60'} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/30 flex items-center justify-center font-serif-display text-base font-semibold shadow-md">
                A
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white leading-tight">Akshat</p>
                <p className="text-xs text-white/55">Citizen</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>
        </div>
      </aside>

      {/* ==================== RIGHT WORKSPACE ==================== */}
      <div className="relative z-10 flex-1 h-full flex flex-col justify-between gap-4 min-w-0">
        
        {/* TOP BAR */}
        <header className="flex items-center justify-between w-full shrink-0">
          <div className="w-32" />

          <div className="relative w-[460px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={17} />
            <input
              type="text"
              placeholder="Search issues, locations or keywords..."
              className="w-full bg-white/12 backdrop-blur-2xl border border-white/20 rounded-full py-2.5 pl-11 pr-20 text-sm text-white placeholder-white/55 shadow-lg focus:outline-none focus:border-white/40 transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/60">
              <kbd className="bg-black/30 border border-white/15 px-1.5 py-0.5 rounded text-[10px] font-medium">Ctrl</kbd>
              <kbd className="bg-black/30 border border-white/15 px-1.5 py-0.5 rounded text-[10px] font-medium">K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Toggle Button */}
            <button 
              onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
              className="px-3.5 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer text-xs font-semibold gap-1.5"
            >
              <Globe size={14} />
              {lang}
            </button>

            <button className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer">
              <Sun size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition relative cursor-pointer">
              <Bell size={18} />
              <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                3
              </span>
            </button>
            <button className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer">
              <MessageSquare size={17} />
            </button>
          </div>
        </header>

        {/* CENTER 3-COLUMN GRID */}
        {/* FIX: min-h-0 prevents flex children from overflowing the parent container */}
        <div className="flex-1 grid grid-cols-12 gap-6 items-center min-h-0 relative z-10">
          
          {/* COLUMN 1: Greeting & Stats */}
          <div className="col-span-4 flex flex-col justify-center pl-2">
            <p className="text-xs tracking-[0.25em] uppercase text-white/75 font-medium mb-1">
              Good Evening,
            </p>
            <h1 className="font-serif-display text-6xl font-medium tracking-tight text-white mb-2 drop-shadow-sm">
              Akshat
            </h1>
            <p className="text-white/80 text-base mb-6">
              A cleaner city, a brighter tomorrow.
            </p>

            <div className="grid grid-cols-2 gap-3.5 mb-5">
              <div className="bg-white/12 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition cursor-pointer group shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-9 h-9 rounded-full bg-blue-500/25 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                    <FileText size={17} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">3</span>
                    <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
                <p className="text-xs text-white/70 font-medium">Submitted</p>
              </div>

              <div className="bg-white/12 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition cursor-pointer group shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-9 h-9 rounded-full bg-amber-500/25 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    <Clock size={17} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">2</span>
                    <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
                <p className="text-xs text-white/70 font-medium">In Progress</p>
              </div>

              <div className="bg-white/12 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition cursor-pointer group shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <CheckCircle2 size={17} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">1</span>
                    <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
                <p className="text-xs text-white/70 font-medium">Resolved</p>
              </div>

              <div className="bg-white/12 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition cursor-pointer group flex items-center gap-3 shadow-lg">
                <div className="w-9 h-9 shrink-0 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <BarChart3 size={17} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-snug">View</p>
                  <p className="text-xs font-semibold text-white leading-snug">Analytics</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => openNotebookWithCategory()}
              className="group relative w-full rounded-2xl p-4 bg-gradient-to-r from-indigo-950/80 via-indigo-900/75 to-violet-600/80 border border-indigo-400/40 shadow-[0_10px_35px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_45px_rgba(124,58,237,0.55)] transition-all duration-300 flex items-center justify-between cursor-pointer overflow-hidden mb-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-200">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-indigo-200/80 font-semibold">
                    Report a New Issue
                  </p>
                  <p className="font-serif-display text-xl text-white font-medium">
                    Open the Notebook
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-500/60 border border-indigo-300/60 flex items-center justify-center text-white shadow-[0_0_20px_rgba(129,140,248,0.8)] group-hover:scale-105 group-hover:translate-x-0.5 transition">
                <ArrowRight size={18} />
              </div>
            </button>
            <p className="text-xs text-white/60 leading-relaxed pl-1">
              Every report brings us closer to a cleaner,<br />
              safer and smarter city. <span className="inline-block w-6 h-[1px] bg-white/40 align-middle ml-1" />
            </p>
          </div>

          {/* COLUMN 2: 3D Notebook */}
          <div className="col-span-4 flex items-center justify-center relative">
            <div
              onClick={() => openNotebookWithCategory()}
              title="Click to open notebook"
              className="group relative w-[300px] h-[410px] -rotate-6 hover:-rotate-2 hover:scale-105 transition-all duration-500 cursor-pointer"
            >
              <div className="absolute -inset-3 bg-black/75 rounded-3xl blur-2xl translate-y-6 -translate-x-3 transition-all group-hover:blur-3xl" />
              <div className="absolute inset-y-2 -right-2.5 left-4 bg-gradient-to-r from-[#d8ccb8] via-[#f3ead8] to-[#cbbba0] rounded-r-2xl shadow-inner border-y border-r border-[#a6967c]" />
              <div className="absolute -bottom-2 left-3 right-1 h-4 bg-gradient-to-b from-[#e8dec8] to-[#b8a98f] rounded-b-xl border-x border-b border-[#8c7d65]" />
              <div 
                className="relative w-full h-full rounded-r-2xl rounded-l-md bg-[#181715] border border-white/15 shadow-[inset_0_2px_15px_rgba(255,255,255,0.12),0_25px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between p-8 overflow-hidden"
                style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 0)`, backgroundSize: '6px 6px' }}
              >
                <div className="absolute top-0 bottom-0 left-0 w-7 bg-gradient-to-r from-black/80 via-white/5 to-black/60 border-r border-black/80" />
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-100/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-100/15 transition" />
                <div />
                <div className="text-center pl-2 pr-4 my-auto">
                  <h2 className="font-serif-display text-4xl font-semibold tracking-wide bg-gradient-to-b from-[#fff3d1] via-[#e5c17c] to-[#b3893e] bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)] leading-tight">
                    Call for<br />Resolve
                  </h2>
                  <div className="my-5 flex flex-col items-center justify-center opacity-85">
                    <svg width="90" height="36" viewBox="0 0 100 40" fill="none" className="stroke-[#dab674]">
                      <path d="M15 28 C 40 22, 60 18, 85 12" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M35 23 C 30 14, 38 10, 42 20" strokeWidth="1.3" />
                      <path d="M50 20 C 46 10, 55 8, 57 18" strokeWidth="1.3" />
                      <path d="M65 16 C 62 8, 70 6, 72 14" strokeWidth="1.3" />
                      <path d="M42 22 C 45 30, 53 28, 52 20" strokeWidth="1.3" />
                      <path d="M58 18 C 62 26, 70 24, 68 16" strokeWidth="1.3" />
                    </svg>
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#dab674]/70 to-transparent mt-2" />
                  </div>
                </div>
                <div className="text-center pl-2 pr-4 pb-2">
                  <p className="text-[10px] tracking-[0.24em] uppercase text-[#dab674]/90 font-semibold leading-relaxed">
                    People Report.<br />Cities Improve.
                  </p>
                </div>
                <div className="absolute top-0 bottom-0 right-5 w-5 bg-gradient-to-r from-[#0e0d0c] via-[#242220] to-[#0e0d0c] shadow-[0_0_12px_rgba(0,0,0,0.95)] border-x border-white/5" />
              </div>
              <div className="absolute -bottom-7 left-12 w-4 h-9 bg-[#121110] shadow-lg -rotate-6 rounded-b-sm" />
            </div>
          </div>

          {/* COLUMN 3: Recent Updates + City Map */}
          {/* FIX: Set max-h-full and flex-1 so it respects the grid cell bounds */}
          <div className="col-span-4 flex flex-col gap-4 max-h-full overflow-hidden justify-center relative">
            
            <div className="bg-black/25 backdrop-blur-2xl border border-white/15 rounded-[26px] p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif-display text-lg font-medium text-white">Recent Updates</h3>
                <button className="text-xs text-white/70 hover:text-white underline underline-offset-4 cursor-pointer">
                  View all
                </button>
              </div>

              <div className="flex flex-col divide-y divide-white/10">
                {[
                  { title: 'Street light fixed', loc: 'Sector 12, Near Park', time: '2h ago', icon: Wrench, badge: 'bg-blue-500/25 border-blue-400/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.35)]' },
                  { title: 'Garbage collection scheduled', loc: 'New Market Road', time: '5h ago', icon: Trash2, badge: 'bg-rose-500/25 border-rose-400/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]' },
                  { title: 'Pothole repair in progress', loc: 'Shivaji Nagar', time: '1d ago', icon: AlertTriangle, badge: 'bg-amber-500/25 border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]' },
                  { title: 'Water leakage reported', loc: 'Arera Colony', time: '2d ago', icon: Droplets, badge: 'bg-purple-500/25 border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]' },
                ].map((item, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${item.badge}`}>
                        <item.icon size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white leading-snug">{item.title}</p>
                        <p className="text-xs text-white/55">{item.loc}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white/50 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-2xl border border-white/15 rounded-[26px] p-5 shadow-2xl flex flex-col shrink-0 h-[210px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif-display text-lg font-medium text-white">City Map</h3>
                <button className="text-xs text-white/70 hover:text-white underline underline-offset-4 cursor-pointer">
                  View Map
                </button>
              </div>

              <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/15 bg-[#cbd5e1]">
                <div 
                  className="absolute inset-0 opacity-75"
                  style={{
                    backgroundImage: `
                      linear-gradient(35deg, transparent 42%, rgba(255,255,255,0.8) 43%, rgba(255,255,255,0.8) 46%, transparent 47%),
                      linear-gradient(-25deg, transparent 58%, rgba(255,255,255,0.7) 59%, rgba(255,255,255,0.7) 62%, transparent 63%),
                      linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px),
                      linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 24px 24px, 24px 24px'
                  }}
                />
                <div className="absolute top-3 right-6 w-24 h-16 bg-emerald-600/20 rounded-full blur-md" />
                <div className="absolute bottom-4 left-10 w-20 h-14 bg-emerald-600/20 rounded-full blur-md" />
                <div className="absolute top-7 left-[54%] -translate-x-1/2 flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.9)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="absolute top-16 left-[33%] flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.9)]" />
                </div>
                <div className="absolute bottom-11 left-[46%] flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
                </div>
                <div className="absolute top-20 right-[22%] flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 bg-slate-900/75 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs text-white shadow-lg">
                  <MapPin size={13} className="text-amber-300" />
                  <span>Sector 17, Bhopal, MP</span>
                  <ArrowRight size={12} className="text-white/60" />
                </div>
                <button className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center hover:scale-105 transition cursor-pointer">
                  <MapPin size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR: Locked structurally (shrink-0, z-20) to prevent map overlap */}
        <footer className="relative z-20 shrink-0 bg-black/25 backdrop-blur-2xl border border-white/15 rounded-[24px] px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xl mt-auto">
          <div className="shrink-0 pr-2">
            <p className="font-serif-display text-base font-medium text-white leading-tight">Popular</p>
            <p className="font-serif-display text-base font-medium text-white leading-tight mb-1">Categories</p>
            <button 
              onClick={() => openNotebookWithCategory()}
              className="text-xs text-white/65 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              See all <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openNotebookWithCategory(cat.label)}
                className="group bg-white/8 hover:bg-white/15 border border-white/12 hover:border-white/30 rounded-2xl py-2.5 px-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/85 group-hover:scale-110 group-hover:bg-amber-400/20 group-hover:border-amber-300/40 group-hover:text-amber-200 transition">
                  <cat.icon size={17} />
                </div>
                <span className="text-[11px] text-white/80 font-medium text-center leading-tight line-clamp-1">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </footer>

      </div>

      {/* ==================== INTERACTIVE ANIMATED NOTEBOOK MODAL ==================== */}
      <AnimatePresence>
        {isNotebookOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="relative w-[920px] h-[600px] bg-[#1a1817] rounded-3xl p-4 shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-white/15 flex">
              
              <button
                onClick={() => setIsNotebookOpen(false)}
                className="absolute -top-4 -right-4 z-30 w-10 h-10 rounded-full bg-neutral-900 border border-white/25 text-white/80 hover:text-white flex items-center justify-center shadow-xl cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* LEFT PAGE: Brand OR Resolved Scrapbook Preview */}
              <div className="flex-1 bg-[#f4ebd9] text-[#2c2520] rounded-l-2xl p-10 flex flex-col justify-between relative shadow-[inset_-18px_0_30px_rgba(0,0,0,0.12)] border-r border-[#d5c7b2]">
                <div className="text-xs tracking-widest uppercase text-[#7a6f63] flex justify-between items-center">
                  <span>Citizen Dossier</span>
                  <button
                    onClick={() => setIsSubmitted(!isSubmitted)}
                    className="text-[11px] bg-[#e5d9c3] hover:bg-[#dacbb0] text-[#3d332a] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <Sparkles size={12} />
                    {isSubmitted ? 'Back to Form' : 'Preview Resolved Scrapbook'}
                  </button>
                </div>

                {!isSubmitted ? (
                  <div className="my-auto text-center px-6">
                    <h2 className="font-serif-display text-5xl font-semibold text-[#231d19] mb-4">
                      Call for<br />Resolve
                    </h2>
                    <div className="w-24 h-[1px] bg-[#8c7d6b] mx-auto my-6" />
                    <p className="font-handwriting text-3xl text-[#4a3f36]">
                      Let's make our city better.
                    </p>
                    <p className="mt-6 text-xs text-[#7a6f63] leading-relaxed">
                      Flip through the pages on the right to record your issue. Once resolved by the department, this page transforms into a community portfolio with taped-up verification photos.
                    </p>
                  </div>
                ) : (
                  <div className="my-auto flex flex-col items-center">
                    <div className="inline-block border-2 border-emerald-700 text-emerald-800 px-3 py-0.5 rounded font-bold text-xs uppercase tracking-widest -rotate-3 mb-4">
                      ✓ Officially Resolved • Core Score 8.6
                    </div>
                    <div className="relative bg-white p-3 pb-7 shadow-xl rotate-2 border border-stone-200 w-64">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-100/70 backdrop-blur-xs -rotate-2 shadow-xs border border-amber-200/50" />
                      <img
                        src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop"
                        alt="Repaired Road"
                        className="w-full h-36 object-cover rounded-xs"
                      />
                      <p className="font-handwriting text-xl text-center text-stone-700 mt-2">
                        Repaired by Dept. Authority A!
                      </p>
                    </div>
                    <div className="mt-5 text-center">
                      <p className="text-xs uppercase tracking-wider text-[#7a6f63] font-semibold">Contributors</p>
                      <p className="font-handwriting text-2xl text-[#2c2520]">
                        Reported by Akshat • Verified by 14 Citizens
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-[#8c7d6b] flex justify-between">
                  <span>Bhopal Municipal Routing</span>
                  <span>AI Priority Grading Enabled</span>
                </div>
              </div>

              {/* RIGHT PAGE: 4-Step Interactive Form with Framer Motion */}
              <div className="flex-1 bg-[#f7efe0] text-[#2c2520] rounded-r-2xl relative shadow-[inset_18px_0_30px_rgba(0,0,0,0.08)] overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentPage}
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 p-10 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center border-b border-[#d8cbb5] pb-3 text-xs tracking-widest uppercase text-[#6e6357] font-semibold">
                      <span>{currentPage === 4 ? 'Review & Submit' : 'Report a Problem'}</span>
                      <span>{currentPage}/4</span>
                    </div>

                    <div className="flex-1 py-5 flex flex-col justify-center">
                      {/* PAGE 1 */}
                      {currentPage === 1 && (
                        <div>
                          <h3 className="font-serif-display text-2xl font-semibold text-[#231d19] mb-4">
                            1. What's the problem?
                          </h3>
                          <div className="flex flex-col gap-2.5">
                            {CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.label)}
                                className="flex items-center gap-3.5 py-1.5 px-2 rounded-lg hover:bg-[#ebe0cc] transition text-left cursor-pointer"
                              >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                                  selectedCategory === cat.label ? 'bg-[#231d19] border-[#231d19] text-white' : 'border-[#8c7d6b]'
                                }`}>
                                  {selectedCategory === cat.label && <Check size={14} />}
                                </div>
                                <cat.icon size={18} className="text-[#4a3f36]" />
                                <span className="font-handwriting text-2xl text-[#2c2520]">{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PAGE 2 */}
                      {currentPage === 2 && (
                        <div className="flex flex-col h-full">
                          <h3 className="font-serif-display text-2xl font-semibold text-[#231d19] mb-4">
                            2. Where is it happening?
                          </h3>
                          <div className="border border-[#b8a992] rounded-xl p-3 bg-[#f2e7d3] flex items-center gap-2.5 mb-4">
                            <MapPin size={18} className="text-[#4a3f36] shrink-0" />
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full bg-transparent font-handwriting text-2xl text-[#2c2520] focus:outline-none"
                            />
                          </div>
                          <div className="flex-1 rounded-xl border border-[#b8a992] bg-[#e6dac3] relative overflow-hidden flex items-center justify-center">
                            <div 
                              className="absolute inset-0 opacity-40"
                              style={{
                                backgroundImage: `linear-gradient(#7a6f63 1px, transparent 1px), linear-gradient(90deg, #7a6f63 1px, transparent 1px)`,
                                backgroundSize: '28px 28px'
                              }}
                            />
                            <div className="relative z-10 flex flex-col items-center">
                              <MapPin size={32} className="text-[#231d19] drop-shadow" />
                              <span className="text-xs font-semibold bg-[#f7efe0] px-2 py-0.5 rounded border border-[#b8a992] mt-1">
                                Drag pin to adjust
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PAGE 3 */}
                      {currentPage === 3 && (
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="font-serif-display text-2xl font-semibold text-[#231d19] mb-3">
                              3. Tell us what happened
                            </h3>
                            <div className="border border-[#b8a992] rounded-xl p-3 bg-[#f2e7d3]">
                              <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-transparent font-handwriting text-2xl text-[#2c2520] focus:outline-none resize-none"
                              />
                              <div className="text-right text-[11px] text-[#7a6f63]">{description.length}/500</div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-serif-display text-xl font-semibold text-[#231d19] mb-2">
                              4. Add a photo (optional)
                            </h3>
                            <div className="border-2 border-dashed border-[#b8a992] rounded-xl p-5 flex flex-col items-center justify-center text-[#5c5046] hover:bg-[#ebe0cc] transition cursor-pointer">
                              <ImageIcon size={28} className="mb-1" />
                              <span className="text-sm font-medium">Attach a photo</span>
                              <span className="text-xs text-[#8c7d6b]">(or paste from clipboard)</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* PAGE 4 */}
                      {currentPage === 4 && (
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="font-serif-display text-2xl font-semibold text-[#231d19] mb-4">
                              Review your complaint
                            </h3>
                            <div className="space-y-3 text-sm border-t border-b border-[#d8cbb5] py-4">
                              <div className="flex gap-3">
                                <span className="w-24 text-[#7a6f63] font-medium">Category :</span>
                                <span className="font-handwriting text-2xl text-[#231d19]">{selectedCategory}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="w-24 text-[#7a6f63] font-medium">Location :</span>
                                <span className="font-handwriting text-2xl text-[#231d19]">{location}</span>
                              </div>
                              <div className="flex gap-3">
                                <span className="w-24 text-[#7a6f63] font-medium">Description :</span>
                                <span className="font-handwriting text-2xl text-[#231d19] flex-1">{description}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-[#ebe0cc] rounded-xl p-3 text-xs text-[#4a3f36] flex items-center justify-between">
                            <span>AI Classifier Auto-Route: <strong>Municipal Roads Dept</strong></span>
                            <span className="font-bold text-rose-700">★ Priority 9.2</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center pt-3 border-t border-[#d8cbb5]">
                      {currentPage > 1 ? (
                        <button
                          onClick={prevPage}
                          className="font-handwriting text-2xl text-[#4a3f36] hover:text-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                      ) : (
                        <div />
                      )}

                      {currentPage < 4 ? (
                        <button
                          onClick={nextPage}
                          className="font-handwriting text-2xl text-[#231d19] font-bold hover:translate-x-1 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          Next <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsSubmitted(true)}
                          className="bg-[#1b2432] hover:bg-[#0f172a] text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg cursor-pointer transition"
                        >
                          Submit <ArrowRight size={15} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}