import {
  BookOpen,
  Bot,
  Bug,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  FlaskConical,
  Home,
  Network,
  Radar,
  Search,
  Shield,
  Terminal,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const MalwareCurriculum = lazy(() => import("./pages/MalwareCurriculum.jsx"));
const ScriptingInteractive = lazy(() => import("./pages/ScriptingInteractive.jsx"));
const MalwareFundamentalsInteractive = lazy(() => import("./pages/MalwareFundamentalsInteractive.jsx"));
const MalwareAnalysisInteractive = lazy(() => import("./pages/MalwareAnalysisInteractive.jsx"));
const SecurityScriptingFundamentals = lazy(() => import("./pages/SecurityScriptingFundamentals.jsx"));
const MalwareFundamentals = lazy(() => import("./pages/MalwareFundamentals.jsx"));
const MalwareAnalysisReverseEngineering = lazy(() => import("./pages/MalwareAnalysisReverseEngineering.jsx"));
const DetectionEngineeringDefense = lazy(() => import("./pages/DetectionEngineeringDefense.jsx"));
const LabsEthicsPractice = lazy(() => import("./pages/LabsEthicsPractice.jsx"));
const ScriptingMasteryPlan = lazy(() => import("./pages/ScriptingMasteryPlan.jsx"));
const SecurityScripting90Day = lazy(() => import("./pages/SecurityScripting90Day.jsx"));
const LabSetupContinuation = lazy(() => import("./pages/LabSetupContinuation.jsx"));
const DetectionDefenseInteractive = lazy(() => import("./pages/DetectionDefenseInteractive.jsx"));
const Month2DailyDetail = lazy(() => import("./pages/Month2DailyDetail.jsx"));
const Month3DailyDetail = lazy(() => import("./pages/Month3DailyDetail.jsx"));
const AdvancedReverseEngineering = lazy(() => import("./pages/AdvancedReverseEngineering.jsx"));
const NetworkForensics = lazy(() => import("./pages/NetworkForensics.jsx"));
const CloudSecurity = lazy(() => import("./pages/CloudSecurity.jsx"));
const ThreatIntelligence = lazy(() => import("./pages/ThreatIntelligence.jsx"));
const LlmSecurity = lazy(() => import("./pages/LlmSecurity.jsx"));

const LESSONS = [
  { id: "curriculum", label: "Full Curriculum", icon: Home, Component: MalwareCurriculum },
  { id: "interactive-scripting", label: "Interactive Scripting", icon: Terminal, Component: ScriptingInteractive },
  { id: "interactive-fundamentals", label: "Interactive Fundamentals", icon: Bug, Component: MalwareFundamentalsInteractive },
  { id: "interactive-analysis", label: "Interactive Analysis", icon: Radar, Component: MalwareAnalysisInteractive },
  { id: "interactive-detection", label: "Interactive Detection", icon: Shield, Component: DetectionDefenseInteractive },
  { id: "scripting", label: "Scripting Fundamentals", icon: Terminal, Component: SecurityScriptingFundamentals },
  { id: "fundamentals", label: "Malware Fundamentals", icon: Bug, Component: MalwareFundamentals },
  { id: "analysis", label: "Analysis and RE", icon: BookOpen, Component: MalwareAnalysisReverseEngineering },
  { id: "detection", label: "Detection Defense", icon: Shield, Component: DetectionEngineeringDefense },
  { id: "advanced-re", label: "Advanced RE", icon: Search, Component: AdvancedReverseEngineering },
  { id: "network-forensics", label: "Network Forensics", icon: Network, Component: NetworkForensics },
  { id: "cloud-security", label: "Cloud Security", icon: Cloud, Component: CloudSecurity },
  { id: "threat-intelligence", label: "Threat Intelligence", icon: Radar, Component: ThreatIntelligence },
  { id: "llm-security", label: "LLM Security", icon: Bot, Component: LlmSecurity },
  { id: "labs", label: "Labs and Ethics", icon: FlaskConical, Component: LabsEthicsPractice },
  { id: "lab-setup", label: "Lab Setup Continuation", icon: FlaskConical, Component: LabSetupContinuation },
  { id: "scripting-mastery-plan", label: "Scripting Mastery Plan", icon: Terminal, Component: ScriptingMasteryPlan },
  { id: "security-scripting-90day", label: "90 Day Scripting", icon: CalendarDays, Component: SecurityScripting90Day },
  { id: "month2-daily-detail", label: "Month 2 Daily Detail", icon: CalendarDays, Component: Month2DailyDetail },
  { id: "month3-daily-detail", label: "Month 3 Daily Detail", icon: CalendarDays, Component: Month3DailyDetail },
];

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const contentRef = useRef(null);

  const activeLesson = LESSONS[activeIndex];
  const ActivePage = activeLesson.Component;
  const progress = ((activeIndex + 1) / LESSONS.length) * 100;

  const navigateTo = useCallback((index) => {
    if (index === activeIndex || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      if (contentRef.current) contentRef.current.scrollTop = 0;
      window.scrollTo({ top: 0 });
      setTimeout(() => setTransitioning(false), 50);
    }, 250);
  }, [activeIndex, transitioning]);

  const goNext = useCallback(() => {
    if (activeIndex < LESSONS.length - 1) navigateTo(activeIndex + 1);
  }, [activeIndex, navigateTo]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) navigateTo(activeIndex - 1);
  }, [activeIndex, navigateTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  return (
    <div className="app">
      {/* ─── Sidebar ─── */}
      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        <div className="brand">
          <span className="brand-mark">SEC</span>
          <div>
            <h1>Security Curriculum</h1>
            <p>Cybersecurity Mastery</p>
          </div>
        </div>

        {/* Progress in sidebar */}
        <div className="sidebar-progress">
          <div className="sidebar-progress-header">
            <span className="sidebar-progress-label">Progress</span>
            <span className="sidebar-progress-value">{activeIndex + 1}/{LESSONS.length}</span>
          </div>
          <div className="sidebar-progress-track">
            <div className="sidebar-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <nav className="nav-list" aria-label="Lesson navigation">
          {LESSONS.map(({ id, label, icon: Icon }, i) => {
            const isActive = i === activeIndex;
            const isCompleted = i < activeIndex;
            return (
              <button
                className={`nav-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                key={id}
                onClick={() => navigateTo(i)}
                type="button"
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
                {isCompleted && <span className="nav-check">✓</span>}
                {isActive && <span className="nav-active-dot" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="workspace">
        {/* Top bar with nav controls */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
              type="button"
            >
              ☰
            </button>
            <div>
              <span className="eyebrow">Module {activeIndex + 1} of {LESSONS.length}</span>
              <h2>{activeLesson.label}</h2>
            </div>
          </div>
          <div className="topbar-nav">
            <button
              className="topbar-nav-btn"
              onClick={goPrev}
              disabled={activeIndex === 0}
              title="Previous module (Alt+←)"
              type="button"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <button
              className="topbar-nav-btn"
              onClick={goNext}
              disabled={activeIndex === LESSONS.length - 1}
              title="Next module (Alt+→)"
              type="button"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Progress bar under topbar */}
        <div className="content-progress-track">
          <div className="content-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Page content with transition */}
        <section className="lesson-surface" ref={contentRef}>
          <div className={`lesson-content ${transitioning ? "lesson-exit" : "lesson-enter"}`}>
            <Suspense fallback={<div className="page-loading"><div className="loading-spinner" /><span>Loading module...</span></div>}>
              <ActivePage />
            </Suspense>
          </div>

          {/* ─── Bottom Navigation ─── */}
          <footer className="bottom-nav">
            {activeIndex > 0 ? (
              <button className="bottom-nav-btn bottom-nav-prev" onClick={goPrev} type="button">
                <ChevronLeft size={20} className="bottom-nav-arrow" />
                <div>
                  <span className="bottom-nav-label">Previous</span>
                  <span className="bottom-nav-title">{LESSONS[activeIndex - 1].label}</span>
                </div>
              </button>
            ) : <div className="bottom-nav-spacer" />}

            {activeIndex < LESSONS.length - 1 ? (
              <button className="bottom-nav-btn bottom-nav-next" onClick={goNext} type="button">
                <div>
                  <span className="bottom-nav-label">Next</span>
                  <span className="bottom-nav-title">{LESSONS[activeIndex + 1].label}</span>
                </div>
                <ChevronRight size={20} className="bottom-nav-arrow" />
              </button>
            ) : (
              <div className="bottom-nav-complete">
                🎉 Curriculum Complete!
              </div>
            )}
          </footer>
        </section>
      </main>
    </div>
  );
}
