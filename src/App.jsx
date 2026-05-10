import {
  BookOpen,
  Bot,
  Bug,
  CalendarDays,
  Cloud,
  FlaskConical,
  Home,
  Network,
  Radar,
  Search,
  Shield,
  Terminal,
} from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";

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
  const [activeId, setActiveId] = useState(LESSONS[0].id);
  const activeLesson = useMemo(
    () => LESSONS.find((lesson) => lesson.id === activeId) ?? LESSONS[0],
    [activeId]
  );
  const ActivePage = activeLesson.Component;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SEC</span>
          <div>
            <h1>Security Curriculum</h1>
            <p>React Project</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Lesson navigation">
          {LESSONS.map(({ id, label, icon: Icon }) => (
            <button
              className={id === activeId ? "nav-item active" : "nav-item"}
              key={id}
              onClick={() => setActiveId(id)}
              type="button"
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Current Module</span>
            <h2>{activeLesson.label}</h2>
          </div>
        </header>
        <section className="lesson-surface">
          <Suspense fallback={<div className="page-loading">Loading module...</div>}>
            <ActivePage />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
