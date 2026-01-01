import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
  Bell,
} from "lucide-react";

import TutorPage from "./modules/Tutor/TutorPage";
import LibraryPage from "./modules/Library/LibraryPage";
import MCQTab from "./modules/mcq/MCQTab";

// FLASHCARDS
import FlashcardsTab from "./modules/flashcards/FlashcardsTab";
import DeckView from "./modules/flashcards/DeckView";
import ReviewScreen from "./modules/flashcards/ReviewScreen";

// SUMMARIES
import SummariesTab from "./modules/summaries/SummariesTab";

// COMPONENTS
import SidebarItem from "./components/SidebarItem";

// TEMP placeholders
const Placeholder = ({ label }) => (
  <div className="h-full flex-center text-muted text-xl">
    {label} Module Coming Soon
  </div>
);

const OSCEModule = () => <Placeholder label="OSCE" />;
const OralExamModule = () => (
  <div className="h-full flex-center">
    <div className="max-w-2xl mx-auto p-8 text-center space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-teal mb-4">
          In Development
        </div>
        <h1 className="text-3xl font-bold text-white">
          Oral Exam Mode — In Development
        </h1>
      </div>
      <div className="space-y-4 text-muted">
        <p className="text-lg leading-relaxed">
          We're actively designing Oral Exam Mode to reflect real examiner behavior —
          stepwise questioning, follow-ups, and pressure-based evaluation.
        </p>
        <p className="text-sm">
          This mode is being tested internally and refined based on real exam patterns.
        </p>
        <p className="text-xs text-muted/80">
          It will be released once accuracy and realism meet our standards.
        </p>
      </div>
    </div>
  </div>
);

const SummariesModule = () => {
  return <SummariesTab />;
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
  const [tempUserData, setTempUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Notifications state - empty initial state, fetched from backend only
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Format relative time helper
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;

    return date.toLocaleDateString();
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setNotifications([]);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
      if (!API_BASE) {
        console.error("VITE_API_URL is missing");
        return;
      }

      const res = await fetch(`${API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch notifications:", res.status);
        setNotifications([]);
        return;
      }

      const data = await res.json();
      
      // DIAGNOSTIC: Log raw API response
      console.log("RAW NOTIFICATIONS RESPONSE", {
        fullResponse: data,
        isArray: Array.isArray(data),
        hasNotifications: !!data.notifications,
        notificationsIsArray: Array.isArray(data.notifications),
        dataKeys: Object.keys(data || {}),
        dataType: typeof data,
      });

      const notificationsList = data.notifications || data || [];
      
      // DIAGNOSTIC: Log processed list
      console.log("NOTIFICATIONS FROM API (processed)", {
        count: notificationsList.length,
        items: notificationsList,
        types: notificationsList.map(n => n.type || n.notification_type || 'unknown'),
      });
      
      // Normalize snake_case backend fields to camelCase for frontend
      const normalizedNotifications = notificationsList.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.description,
        read: n.read,

        // normalize timestamps
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : null,

        // normalize relations
        fileId: n.file_id ?? null,
        summaryId: n.summary_id ?? null,
        mcqDeckId: n.mcq_deck_id ?? null,
        flashcardDeckId: n.flashcard_deck_id ?? null,
      }));
      
      setNotifications(normalizedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  // Clear all notifications handler - calls backend and refetches
  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
      if (!API_BASE) {
        console.error("VITE_API_URL is missing");
        return;
      }

      // Mark all as read in backend
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Refetch notifications from backend
      await fetchNotifications();
    } catch (err) {
      console.error("Error clearing notifications:", err);
      // Still refetch to sync state
      await fetchNotifications();
    }
  };

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

  // Fetch notifications on mount and poll while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

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
  const Sidebar = () => {
    return (
      <aside className="w-20 bg-void border-r border-white/5 flex flex-col items-center py-6 z-40 h-full fixed left-0 top-0">
        <div className="mb-8 flex items-center justify-center">
          <img
            src={logo}
            alt="Synapse Logo"
            className="h-9 w-auto drop-shadow-[0_0_14px_rgba(0,200,180,0.65)]"
          />
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <SidebarItem icon={Folder} label="Library" to="/library" />
          <SidebarItem icon={Brain} label="Tutor" to="/tutor" />
          <SidebarItem icon={Zap} label="Flashcards" to="/flashcards" />
          <SidebarItem icon={CheckSquare} label="MCQ" to="/mcq" />
          <SidebarItem icon={BookOpen} label="Summaries" to="/summaries" />
          <SidebarItem icon={Activity} label="OSCE" to="/osce" />
          <SidebarItem icon={Mic} label="Oral Exam" to="/oral" />
          <SidebarItem icon={Calendar} label="Planner" to="/planner" />
          <SidebarItem icon={BarChart2} label="Analytics" to="/analytics" />
        </nav>

        <div className="mt-auto">
          <SidebarItem icon={Settings} label="Settings" to="/settings" />
        </div>
      </aside>
    );
  };

  // MAIN UI
  return (
    <div className="h-screen w-full text-white flex bg-void relative">
      <Sidebar />

      <main className="flex-1 ml-20 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 flex justify-between items-center px-6 bg-void/90 backdrop-blur z-10">

          {/* LEFT: Logo + Title */}
          <div className="text-xs uppercase tracking-wide text-muted">
            Synapse
            <span className="ml-2 text-teal border border-teal px-1 rounded">
              Beta
            </span>
          </div>

          {/* RIGHT: Notifications + Profile */}
          <div className="flex items-center gap-3 relative">
            {/* Notification Icon */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="relative p-2 rounded-lg hover:bg-white/5 transition"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={20} className="text-muted hover:text-white" />

                {/* Unread indicator */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl bg-[#1a1d24] border border-white/10 shadow-xl">
                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                    <span className="text-sm font-semibold text-white">
                      Notifications
                    </span>

                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-muted hover:text-red-400 transition"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-muted text-center">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => {
                        // DIAGNOSTIC: Log each notification being rendered
                        console.log("RENDERING NOTIFICATION", {
                          id: n.id,
                          type: n.type || n.notification_type || 'unknown',
                          title: n.title || n.message || 'no title',
                          hasTitle: !!n.title,
                          hasMessage: !!n.message,
                          fullNotification: n,
                        });
                        
                        return (
                          <div
                            key={n.id}
                            className={`p-3 text-sm hover:bg-white/5 transition border-b border-white/5 last:border-b-0 ${
                              !n.read ? "bg-white/2" : ""
                            }`}
                          >
                            <div className="font-medium text-white">
                              {n.title || n.message || "Notification"}
                            </div>
                            <div className="text-muted text-xs mt-1">
                              {n.description || n.body || n.content || ""}
                            </div>
                            <div className="text-muted text-[10px] mt-1">
                              {formatRelativeTime(n.createdAt || n.created_at || n.created_at)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

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
          <Routes>
            <Route path="/" element={<Navigate to="/tutor" replace />} />
            
            {/* Library routes */}
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:fileId" element={<LibraryPage />} />
            <Route path="/library/:fileId/page/:pageNumber" element={<LibraryPage />} />
            
            {/* Other module routes */}
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/flashcards" element={
              <div className="flex-1 overflow-y-auto p-6">
                <FlashcardsModule />
              </div>
            } />
            <Route path="/mcq" element={
              <div className="flex-1 overflow-y-auto p-6">
                <MCQTab />
              </div>
            } />
            <Route path="/summaries" element={
              <div className="flex-1 overflow-y-auto p-6">
                <SummariesModule />
              </div>
            } />
            <Route path="/osce" element={
              <div className="flex-1 overflow-y-auto p-6">
                <OSCEModule />
              </div>
            } />
            <Route path="/oral" element={
              <div className="flex-1 overflow-y-auto p-6">
                <OralExamModule />
              </div>
            } />
            <Route path="/planner" element={
              <div className="flex-1 overflow-y-auto p-6">
                <PlannerModule />
              </div>
            } />
            <Route path="/analytics" element={
              <div className="flex-1 overflow-y-auto p-6">
                <AnalyticsModule />
              </div>
            } />
            <Route path="/settings" element={
              <div className="flex-1 overflow-y-auto p-6">
                <SettingsPage
                  profile={profile}
                  onLogout={() => setIsAuthenticated(false)}
                />
              </div>
            } />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/tutor" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}; // ✅ THIS WAS MISSING

export default function App() {
  return <SynapseOS />;
}
