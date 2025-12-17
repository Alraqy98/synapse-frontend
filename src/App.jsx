import React, { useState, useEffect } from "react";
import "./styles.css";
import logo from "./assets/synapse-logo.png";

// Landing + Auth Screens
import LandingPage from "./components/LandingPage";
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import AuthCallback from "./components/auth/AuthCallback";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import { supabase } from "./lib/supabaseClient";
import SettingsPage from "./modules/settings/SettingsPage";

// Icons
import {
  Folder,
  Brain,
  Zap,
  CheckSquare,
  Activity,
  Mic,
  BookOpen,
  Calendar,
  BarChart2,
  Settings,
  Hexagon,
} from "lucide-react";

import TutorPage from "./modules/Tutor/TutorPage";
import LibraryPage from "./modules/Library/LibraryPage";
import MCQTab from "./modules/mcq/MCQTab";

// FLASHCARDS
import FlashcardsTab from "./modules/flashcards/FlashcardsTab";
import DeckView from "./modules/flashcards/DeckView";
import ReviewScreen from "./modules/flashcards/ReviewScreen";

// TEMP placeholders
const Placeholder = ({ label }) => (
  <div className="h-full flex-center text-muted text-xl">
    {label} Module Coming Soon
  </div>
);

const OSCEModule = () => <Placeholder label="OSCE" />;
const OralExamModule = () => <Placeholder label="Oral Exam Prep" />;
const SummariesModule = () => {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-10 py-10">

      {/* STATUS */}
      <div className="panel p-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Summaries Module
          </h1>
          <p className="text-sm text-muted mt-2">
            Actively in development · First release very soon
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs text-teal font-semibold">
            BUILDING
          </span>
        </div>
      </div>

      {/* ROADMAP */}
      <div className="panel p-8">
        <h2 className="text-lg font-semibold text-white mb-6">
          What’s coming first
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "High-Yield Bullet Summaries",
              desc: "Condensed, exam-focused points with zero fluff",
            },
            {
              title: "Page-Linked References",
              desc: "Every claim traceable back to your slides or PDFs",
            },
            {
              title: "Exam vs Study Mode",
              desc: "Switch between deep understanding and rapid revision",
            },
            {
              title: "Flashcards from Summaries",
              desc: "One click → spaced repetition ready",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-teal/40 transition"
            >
              <div className="font-semibold text-white">
                {item.title}
              </div>
              <div className="text-sm text-muted mt-1">
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-muted">
          Updates are announced in Settings → Announcements
        </div>
      </div>

      {/* FEEDBACK */}
      <div className="panel p-8">
        <h2 className="text-lg font-semibold text-white mb-2">
          Shape this module
        </h2>
        <p className="text-sm text-muted mb-4">
          Tell us what you actually want. We read everything.
        </p>

        <textarea
          placeholder="Example: I want summaries to follow exam patterns and highlight common traps…"
          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-teal"
          rows={4}
        />

        <button className="btn-primary mt-4 w-full">
          Send suggestion
        </button>
      </div>

    </div>
  );
};

const PlannerModule = () => <Placeholder label="Planner" />;
const AnalyticsModule = () => <Placeholder label="Analytics" />;

const SettingsModule = ({ onLogout }) => (
  <div className="flex-center flex-col gap-4 text-muted">
    <div className="panel p-8 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      <button
        className="btn btn-primary"
        onClick={() => {
          supabase.auth.signOut().catch(console.error);
          localStorage.removeItem("access_token");
          onLogout();
        }}
      >
        Logout
      </button>
    </div>
  </div>
);

// ===================================================================
// FLASHCARDS MODULE WRAPPER (NEW)
// ===================================================================
function FlashcardsModule() {
  const [view, setView] = useState("list"); // list | deck | review
  const [deckId, setDeckId] = useState(null);

  function openDeck(id) {
    setDeckId(id);
    setView("deck");
  }

  function startReview(id) {
    setDeckId(id);
    setView("review");
  }

  function goBack() {
    setView("list");
    setDeckId(null);
  }

  return (
    <div className="h-full w-full">
      {view === "list" && <FlashcardsTab openDeck={openDeck} />}

      {view === "deck" && (
        <DeckView deckId={deckId} goBack={goBack} openReview={startReview} />
      )}

      {view === "review" && (
        <ReviewScreen deckId={deckId} goBack={() => setView("deck")} />
      )}
    </div>
  );
}

// ===================================================================
// MAIN APP
// ===================================================================
const SynapseOS = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState("landing");
  const [module, setModule] = useState("tutor");
  const [theme, setTheme] = useState("dark");
  const [tempUserData, setTempUserData] = useState(null);
  const [profile, setProfile] = useState(null);

  // Theme
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      setIsAuthenticated(true);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        return;
      }

      if (
        !profileData ||
        !profileData.field_of_study ||
        !profileData.stage
      ) {
        setProfile(profileData || null);
        setAuthScreen("onboarding");
        return;
      }

      setProfile(profileData);
      setAuthScreen(null);
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  // Session sync
  useEffect(() => {
    const sync = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session?.access_token) {
        localStorage.setItem("access_token", session.access_token);
      }
    };
    sync();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          localStorage.setItem("access_token", session.access_token);
          fetchProfile();
        } else {
          localStorage.removeItem("access_token");
          setIsAuthenticated(false);
          setProfile(null);
          setAuthScreen("landing");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // /auth/callback
  if (window.location.pathname.startsWith("/auth/callback")) {
    return (
      <AuthCallback
        onFinish={(success) => {
          if (success) fetchProfile();
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  // Onboarding
  if (authScreen === "onboarding") {
    return (
      <OnboardingFlow
        initialFullName={tempUserData?.fullName}
        initialEmail={tempUserData?.email}
        onComplete={() => {
          fetchProfile();
          setTempUserData(null);
          setAuthScreen(null);
        }}
      />
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (authScreen === "landing") {
      return (
        <LandingPage
          onLogin={() => setAuthScreen("login")}
          onSignup={() => setAuthScreen("signup")}
        />
      );
    }

    if (authScreen === "signup") {
      return <SignUp onSwitchToLogin={() => setAuthScreen("login")} />;
    }

    if (authScreen === "login") {
      return (
        <Login
          onSuccess={(userMeta) => {
            setTempUserData(userMeta);
            fetchProfile();
          }}
          onSwitchToSignup={() => setAuthScreen("signup")}
        />
      );
    }
  }

  // Sidebar
  const Sidebar = () => (
    <aside className="w-20 bg-void border-r border-white/5 flex flex-col items-center py-6 z-40 h-full fixed left-0 top-0">
      <div className="mb-8 flex items-center justify-center">
        <img
          src={logo}
          alt="Synapse Logo"
          className="h-9 w-auto drop-shadow-[0_0_14px_rgba(0,200,180,0.65)]"
        />
      </div>

      <nav className="flex flex-col gap-4 w-full px-2">
        {[
          { id: "library", icon: Folder },
          { id: "tutor", icon: Brain },
          { id: "flash", icon: Zap },
          { id: "mcq", icon: CheckSquare },
          { id: "summaries", icon: BookOpen },
          { id: "osce", icon: Activity },
          { id: "oral", icon: Mic },
          { id: "plan", icon: Calendar },
          { id: "stat", icon: BarChart2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setModule(item.id)}
            className={`nav-item ${module === item.id ? "active" : ""}`}
          >
            <item.icon size={20} />
          </button>
        ))}
      </nav>

      <button
        onClick={() => setModule("settings")}
        className={`nav-item mt-auto ${module === "settings" ? "active" : ""}`}
      >
        <Settings size={20} />
      </button>
    </aside>
  );

  // MAIN UI
  return (
    <div className="h-screen w-full text-white flex bg-void relative">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-void/90 backdrop-blur z-10">

          {/* LEFT: Logo + Title */}
          <div className="text-xs uppercase tracking-wide text-muted">
            Synapse OS
            <span className="ml-2 text-teal border border-teal px-1 rounded">
              Beta
            </span>
          </div>

          {/* RIGHT: Theme + Profile */}
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary px-3 py-1 text-xs"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            {profile && (
              <>
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold">
                    {profile.full_name || "User"}
                  </div>
                  <div className="text-[10px] text-muted">
                    {profile.stage || "Student"}
                  </div>
                </div>

                <img
                  src={
                    profile.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      profile.full_name || "U"
                    )}`
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full bg-teal/10"
                />
              </>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {module === "library" && <LibraryPage />}
          {module === "tutor" && <TutorPage />}

          {[
            "flash",
            "osce",
            "oral",
            "summaries",
            "plan",
            "stat",
            "settings",
            "mcq",
          ].includes(module) && (
              <div className="flex-1 overflow-y-auto p-6">
                {module === "flash" && <FlashcardsModule />}
                {module === "osce" && <OSCEModule />}
                {module === "oral" && <OralExamModule />}
                {module === "summaries" && <SummariesModule />}
                {module === "plan" && <PlannerModule />}
                {module === "stat" && <AnalyticsModule />}

                {module === "settings" && (
                  <SettingsPage
                    profile={profile}
                    onLogout={() => setIsAuthenticated(false)}
                  />
                )}
                {module === "mcq" && <MCQTab />}
              </div>
            )}
        </div>
      </main>
    </div>
  );
}; // ✅ THIS WAS MISSING

export default function App() {
  return <SynapseOS />;
}
