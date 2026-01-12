import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
import "./styles.css";
import logo from "./assets/synapse-logo.png";

// Landing + Auth Screens
import LandingPage from "./components/LandingPage";
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import AuthCallback from "./components/auth/AuthCallback";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import { supabase } from "./lib/supabaseClient";
import SettingsPage from "./modules/settings/SettingsPage";
import ChangePasswordModal from "./components/ChangePasswordModal";
import NotificationDetailModal from "./components/NotificationDetailModal";
import AdminPanel from "./modules/admin/AdminPanel";
import AdminUsers from "./modules/admin/pages/AdminUsers";
import AdminContent from "./modules/admin/pages/AdminContent";
import AdminFiles from "./modules/admin/pages/AdminFiles";
import AdminNotifications from "./modules/admin/pages/AdminNotifications";
import AdminSettings from "./modules/admin/pages/AdminSettings";

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
  Home,
  Lock,
  Users,
  FileText,
} from "lucide-react";

import TutorPage from "./modules/Tutor/TutorPage";
import LibraryPage from "./modules/Library/LibraryPage";
import MCQTab from "./modules/mcq/MCQTab";
import DashboardPage from "./modules/dashboard/DashboardPage";
import LibraryUploadModal from "./modules/Library/LibraryUploadModal";
import GenerateSummaryModal from "./modules/summaries/GenerateSummaryModal";
import GenerateMCQModal from "./modules/mcq/GenerateMCQModal";
import GenerateFlashcardsModal from "./modules/flashcards/GenerateFlashcardsModal";

// FLASHCARDS
import FlashcardsTab from "./modules/flashcards/FlashcardsTab";
import DeckView from "./modules/flashcards/DeckView";
import ReviewScreen from "./modules/flashcards/ReviewScreen";

// SUMMARIES
import SummariesTab from "./modules/summaries/SummariesTab";

// COMPONENTS
import SidebarItem from "./components/SidebarItem";
import ErrorBoundary from "./components/ErrorBoundary";
import { DemoProvider, useDemo } from "./modules/demo/DemoContext";
import DemoOverlay from "./modules/demo/DemoOverlay";
import { demoApiIntercept } from "./modules/demo/demoApiRuntime";

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
  // SummariesTab reads URL params directly via useParams()
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
  const { deckId: urlDeckId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // list | deck | review
  const [deckId, setDeckId] = useState(null);

  // Handle deep link from URL
  useEffect(() => {
    if (urlDeckId && urlDeckId !== deckId) {
      setDeckId(urlDeckId);
      setView("deck");
    } else if (!urlDeckId && view !== "list") {
      // URL changed to remove deckId, reset to list
      setView("list");
      setDeckId(null);
    }
  }, [urlDeckId]);

  function openDeck(id) {
    setDeckId(id);
    setView("deck");
    navigate(`/flashcards/${id}`, { replace: true });
  }

  function startReview(id) {
    setDeckId(id);
    setView("review");
    // Keep URL as deck view, review is a sub-view
  }

  function goBack() {
    setView("list");
    setDeckId(null);
    navigate("/flashcards", { replace: true });
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState("landing");
  const [tempUserData, setTempUserData] = useState(null);
  const [profile, setProfile] = useState(null);

  // Detect admin route
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Notifications state - empty initial state, fetched from backend only
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Notification type handler map
  const notificationTypeHandlers = {
    // Admin/system types that open modal
    admin: "modal",
    system: "modal",
    announcement: "modal",
    // Completion types that navigate
    summary_completed: "navigate",
    mcq_completed: "navigate",
    flashcard_completed: "navigate",
  };

  // Helper to determine notification behavior
  const getNotificationBehavior = (type) => {
    if (!type) return "none";
    
    // Check exact match first
    if (notificationTypeHandlers[type]) {
      return notificationTypeHandlers[type];
    }
    
    // Check for completion pattern
    if (type.includes("completed")) {
      return "navigate";
    }
    
    return "none";
  };

  // Check if notification is admin/system type
  const isAdminNotification = (type) => {
    return type === "admin" || type === "system" || type === "announcement";
  };

  // Centralized modal state
  const [activeModal, setActiveModal] = useState(null); // "upload" | "summary" | "mcq" | "flashcards" | null

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

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      // Demo Mode interception: notifications → demo data
      const demoRes = demoApiIntercept({
        method: "GET",
        url: "/notifications",
      });
      if (demoRes.handled) {
        // Demo data is already normalized, use directly
        setNotifications(demoRes.data || []);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data: notificationsList, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        return;
      }

      // Normalize snake_case backend fields to camelCase for frontend
      const normalizedNotifications = (notificationsList || []).map(n => {
        // Helper to ensure we get a valid ID or null (not empty string)
        const normalizeId = (id) => {
          if (!id) return null;
          const str = String(id).trim();
          return str.length > 0 ? str : null;
        };

        return {
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          read: n.read,

          // normalize timestamps
          createdAt: n.created_at ? new Date(n.created_at).toISOString() : null,

          // normalize relations - ensure we get valid IDs or null
          fileId: normalizeId(n.file_id),
          summaryId: normalizeId(n.summary_id),
          mcqDeckId: normalizeId(n.mcq_deck_id),
          flashcardDeckId: normalizeId(n.flashcard_deck_id),
        };
      });
      
      setNotifications(normalizedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  // Mark notification as read (acknowledged)
  const markNotificationAsRead = async (notificationId) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    try {
      // Demo Mode interception
      const demoRes = demoApiIntercept({
        method: "PATCH",
        url: `/notifications/${notificationId}/read`,
      });
      if (demoRes.handled) {
        // Demo mode handled, optimistic update already applied
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        // Revert optimistic update if no user
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
        );
        return;
      }

      // Update in Supabase
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error marking notification as read:", error);
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
    }
  };

  // Clear all notifications handler - marks ALL notifications (including admin) as read
  const handleClearAll = async () => {
    // Capture unread notifications before any state updates
    const unreadNotifications = notifications.filter((n) => !n.read);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      if (unreadNotifications.length === 0) {
        // No unread notifications to clear
        return;
      }

      // Optimistically mark all notifications as read in UI
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );

      // Demo Mode interception
      const demoRes = demoApiIntercept({
        method: "PATCH",
        url: "/notifications/clear-all",
      });
      if (demoRes.handled) {
        // Demo mode handled, optimistic update already applied
        return;
      }

      // Mark all unread notifications as read in Supabase (including admin notifications)
      const unreadIds = unreadNotifications.map((n) => n.id);
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .in("id", unreadIds);

      if (error) {
        console.error("Error clearing notifications:", error);
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) => {
            const original = unreadNotifications.find((un) => un.id === n.id);
            return original ? { ...n, read: false } : n;
          })
        );
        return;
      }

      // Optimistic update already applied, no additional action needed
    } catch (err) {
      console.error("Error clearing notifications:", err);
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((n) => {
          const original = unreadNotifications.find((un) => un.id === n.id);
          return original ? { ...n, read: false } : n;
        })
      );
    }
  };

  // Handle notification click - uses type handlers to determine behavior
  const handleNotificationClick = (notification) => {
    const behavior = getNotificationBehavior(notification.type);

    // Close dropdown
    setNotificationsOpen(false);

    if (behavior === "modal") {
      // Admin/system notifications open modal
      setSelectedNotification(notification);
      return;
    }

    if (behavior === "navigate") {
      // Completion notifications navigate to related content
      // Helper to validate ID (not null, not empty string, not undefined)
      const isValidId = (id) => {
        return id && typeof id === 'string' && id.trim().length > 0;
      };

      // Priority: Specific generated objects take precedence over file view
      // Deep-link to the exact generated object, not just the section
      
      // 1. Summary-specific notification → deep-link to summary
      if (isValidId(notification.summaryId)) {
        console.log("[Notification] Navigating to summary", `/summaries/${notification.summaryId}`);
        navigate(`/summaries/${notification.summaryId}`);
        return;
      }
      
      // 2. MCQ-specific notification → deep-link to MCQ deck
      if (isValidId(notification.mcqDeckId)) {
        console.log("[Notification] Navigating to MCQ deck", `/mcq/${notification.mcqDeckId}`);
        navigate(`/mcq/${notification.mcqDeckId}`);
        return;
      }
      
      // 3. Flashcard-specific notification → deep-link to flashcard deck
      if (isValidId(notification.flashcardDeckId)) {
        console.log("[Notification] Navigating to flashcard deck", `/flashcards/${notification.flashcardDeckId}`);
        navigate(`/flashcards/${notification.flashcardDeckId}`);
        return;
      }

      // 4. Fallback: Navigate to file view if no specific object exists
      // This handles render/OCR notifications and other file-level events
      if (isValidId(notification.fileId)) {
        console.log("[Notification] Navigating to file view", `/library/${notification.fileId}`);
        navigate(`/library/${notification.fileId}`);
        return;
      }

      // If we get here, no valid IDs were found
      // Do NOT navigate - notification is not clickable
      console.warn("[Notification] No valid IDs found for navigation - notification is not clickable", notification);
      return;
    }

    // behavior === "none" - do nothing
    console.log("[Notification] Notification type has no click behavior", { type: notification.type });
  };

  // Handle notification acknowledgment (OK button in modal)
  const handleNotificationAcknowledge = () => {
    if (!selectedNotification) return;

    // Mark as read
    markNotificationAsRead(selectedNotification.id);

    // Close modal
    setSelectedNotification(null);
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

      // Check if we're on admin route (use location.pathname since isAdminRoute may not be updated yet)
      const currentIsAdminRoute = location.pathname.startsWith("/admin");

      // Admin route: validate admin role
      if (currentIsAdminRoute) {
        // If profile exists but user is not admin, reject access
        if (profileData && !profileData.is_admin) {
          // Non-admin user trying to access admin panel
          // Sign out and redirect to admin login
          await supabase.auth.signOut();
          localStorage.removeItem("access_token");
          setIsAuthenticated(false);
          setProfile(null);
          setAuthScreen("login");
          return;
        }
        
        // Admin user: set profile and allow access
        setProfile(profileData);
        setAuthScreen(null);
        return;
      }

      // Normal app: check onboarding
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

  // Force logout on admin entry - HARD AUTH BOUNDARY
  useEffect(() => {
    if (isAdminRoute) {
      // Immediately clear auth state and sign out
      const forceLogout = async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("Error signing out on admin entry:", err);
        }
        // Clear all auth state
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        setProfile(null);
        setAuthScreen("login"); // Set to login screen for admin
      };
      forceLogout();
    }
  }, [isAdminRoute]);

  // Session sync (only for non-admin routes)
  useEffect(() => {
    // Skip session sync if we're on admin route
    if (isAdminRoute) return;

    const sync = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session?.access_token) {
        localStorage.setItem("access_token", session.access_token);
      }
    };
    sync();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Ignore auth state changes on admin routes
        if (isAdminRoute) return;

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
  }, [isAdminRoute]);

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
    if (!notificationsOpen) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the dropdown ref (which includes button and dropdown)
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    // Use mousedown to catch clicks before they bubble
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!accountDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target)
      ) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountDropdownOpen]);

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

  // Password recovery routes (accessible without authentication)
  if (window.location.pathname === "/forgot-password") {
    return <ForgotPassword />;
  }

  if (window.location.pathname === "/reset-password") {
    return <ResetPassword />;
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

  // Admin role validation after profile fetch
  useEffect(() => {
    // Only validate if we're on admin route, authenticated, and profile is loaded
    if (isAdminRoute && isAuthenticated && profile !== null) {
      if (!profile.is_admin) {
        // Non-admin user: sign out and redirect to admin login
        const rejectNonAdmin = async () => {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error("Error signing out non-admin user:", err);
          }
          localStorage.removeItem("access_token");
          setIsAuthenticated(false);
          setProfile(null);
          setAuthScreen("login");
        };
        rejectNonAdmin();
      }
    }
  }, [isAdminRoute, isAuthenticated, profile]);

  // Navigation safety: redirect user routes to /admin when in admin context
  useEffect(() => {
    if (isAdminRoute && isAuthenticated && profile?.is_admin === true) {
      // If in admin context and trying to access a user route, redirect to /admin
      const userRoutes = [
        "/dashboard",
        "/library",
        "/tutor",
        "/flashcards",
        "/mcq",
        "/summaries",
        "/osce",
        "/oral",
        "/planner",
        "/analytics",
        "/settings",
      ];
      
      // Check if current path is a user route (but not an admin route)
      const isUserRoute = userRoutes.some(route => 
        location.pathname === route || location.pathname.startsWith(route + "/")
      );
      
      // Only redirect if it's a user route and NOT an admin route
      if (isUserRoute && !location.pathname.startsWith("/admin")) {
        navigate("/admin", { replace: true });
      }
    }
  }, [isAdminRoute, isAuthenticated, profile, location.pathname, navigate]);

  // Not authenticated
  if (!isAuthenticated) {
    // Admin route: always show login screen directly (no landing page)
    if (isAdminRoute) {
      return (
        <Login
          adminMode={true}
          onSuccess={(userMeta) => {
            setTempUserData(userMeta);
            fetchProfile();
          }}
          onSwitchToSignup={() => {
            // Admin route doesn't support signup, redirect to normal signup
            navigate("/");
            setAuthScreen("signup");
          }}
        />
      );
    }

    // Normal app: show landing/login/signup as usual
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
          adminMode={false}
          onSuccess={(userMeta) => {
            setTempUserData(userMeta);
            fetchProfile();
          }}
          onSwitchToSignup={() => setAuthScreen("signup")}
        />
      );
    }
  }

  // Admin sidebar navigation config
  const adminSidebarItems = [
    { icon: Home, label: "Home", to: "/admin", showAccent: location.pathname === "/admin" },
    { icon: Users, label: "Users", to: "/admin/users" },
    { icon: FileText, label: "Content", to: "/admin/content" },
    { icon: Folder, label: "Files", to: "/admin/files" },
    { icon: Bell, label: "Notifications", to: "/admin/notifications" },
  ];

  // User sidebar navigation config (existing items)
  const userSidebarItems = [
    { icon: Home, label: "Dashboard", to: "/dashboard", showAccent: location.pathname === "/dashboard" },
    { icon: Folder, label: "Library", to: "/library", dataDemo: "nav-library" },
    { icon: Brain, label: "Tutor", to: "/tutor" },
    { icon: Zap, label: "Flashcards", to: "/flashcards" },
    { icon: CheckSquare, label: "MCQ", to: "/mcq", dataDemo: "nav-mcqs" },
    { icon: BookOpen, label: "Summaries", to: "/summaries" },
    { icon: Activity, label: "OSCE", to: "/osce" },
    { icon: Mic, label: "Oral Exam", to: "/oral" },
    { icon: Calendar, label: "Planner", to: "/planner" },
    { icon: BarChart2, label: "Analytics", to: "/analytics" },
  ];

  // Sidebar
  const Sidebar = () => {
    // Determine which sidebar items to show based on context
    const sidebarItems = isAdminRoute ? adminSidebarItems : userSidebarItems;

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
        {sidebarItems.map((item, idx) => (
          <SidebarItem
            key={idx}
            icon={item.icon}
            label={item.label}
            to={item.to}
            showAccent={item.showAccent}
            dataDemo={item.dataDemo}
          />
        ))}
      </nav>

        <div className="mt-auto">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            to={isAdminRoute ? "/admin/settings" : "/settings"} 
          />
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
        <header className="h-16 flex-shrink-0 border-b border-white/5 flex justify-between items-center px-6 bg-void/90 backdrop-blur z-10">

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
                data-demo="notif-bell"
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
                        // Determine if notification is clickable using type handler
                        const behavior = getNotificationBehavior(n.type);
                        const isClickable = behavior === "modal" || behavior === "navigate";
                        
                        const dataDemo =
                          n.type === "mcq_completed" ? "notif-item-mcq-ready" : undefined;

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-sm transition border-b border-white/5 last:border-b-0 ${
                              !n.read ? "bg-white/2" : ""
                            } ${
                              isClickable 
                                ? "hover:bg-white/10 cursor-pointer" 
                                : "hover:bg-white/5 cursor-default"
                            }`}
                            data-demo={dataDemo}
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
              <div className="relative" ref={accountDropdownRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition"
                  aria-label="Account menu"
                >
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
                </button>

                {/* Account Dropdown */}
                {accountDropdownOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-[#1a1d24] border border-white/10 shadow-xl overflow-hidden">
                    {/* Account Info */}
                    <div className="p-4 border-b border-white/5">
                      <div className="text-sm font-semibold text-white">
                        {profile.full_name || "User"}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {profile.email}
                      </div>
                      {profile.stage && (
                        <div className="text-xs text-muted mt-1">
                          Stage: {profile.stage}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/5" />

                    {/* Change Password */}
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        setChangePasswordModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <Lock size={16} className="text-muted" />
                      Change Password
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-white/5" />

                    {/* Logout */}
                    <button
                      onClick={async () => {
                        setAccountDropdownOpen(false);
                        try {
                          await supabase.auth.signOut();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          localStorage.removeItem("access_token");
                          setIsAuthenticated(false);
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={
              isAdminRoute && isAuthenticated && profile?.is_admin === true
                ? <Navigate to="/admin" replace />
                : <Navigate to="/dashboard" replace />
            } />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={
              <div className="flex-1 overflow-y-auto p-6">
                <DashboardPage 
                  profile={profile}
                  onOpenUploadModal={() => setActiveModal("upload")}
                  onOpenSummaryModal={() => setActiveModal("summary")}
                  onOpenMCQModal={() => setActiveModal("mcq")}
                  onOpenFlashcardsModal={() => setActiveModal("flashcards")}
                />
              </div>
            } />
            
            {/* Library routes */}
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:fileId" element={<LibraryPage />} />
            <Route path="/library/:fileId/page/:pageNumber" element={<LibraryPage />} />
            
            {/* Tutor routes */}
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/tutor/:sessionId" element={<TutorPage />} />
            <Route path="/flashcards" element={
              <div className="flex-1 overflow-y-auto p-6">
                <FlashcardsModule />
              </div>
            } />
            <Route path="/flashcards/:deckId" element={
              <div className="flex-1 overflow-y-auto p-6">
                <FlashcardsModule />
              </div>
            } />
            <Route path="/mcq" element={
              <div className="flex-1 overflow-y-auto p-6">
                <MCQTab />
              </div>
            } />
            <Route path="/mcq/:deckId" element={
              <div className="flex-1 overflow-y-auto p-6">
                <MCQTab />
              </div>
            } />
            <Route path="/summaries" element={
              <div className="flex-1 overflow-y-auto p-6">
                <SummariesModule />
              </div>
            } />
            <Route path="/summaries/:summaryId" element={
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
            
            {/* Admin Routes - Only accessible if is_admin === true */}
            <Route path="/admin" element={
              isAuthenticated && profile?.is_admin === true ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <AdminPanel profile={profile} />
                </div>
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            <Route path="/admin/users" element={
              isAuthenticated && profile?.is_admin === true ? (
                <AdminUsers />
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            <Route path="/admin/content" element={
              isAuthenticated && profile?.is_admin === true ? (
                <AdminContent />
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            <Route path="/admin/files" element={
              isAuthenticated && profile?.is_admin === true ? (
                <AdminFiles />
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            <Route path="/admin/notifications" element={
              isAuthenticated && profile?.is_admin === true ? (
                <AdminNotifications />
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            <Route path="/admin/settings" element={
              isAuthenticated && profile?.is_admin === true ? (
                <AdminSettings />
              ) : (
                <Navigate to="/admin" replace />
              )
            } />
            
            {/* Catch-all redirect */}
            <Route path="*" element={
              isAdminRoute && isAuthenticated && profile?.is_admin === true 
                ? <Navigate to="/admin" replace />
                : <Navigate to="/dashboard" replace />
            } />
            </Routes>
          </ErrorBoundary>

          {/* Centralized Modals */}
          {activeModal === "upload" && (
            <LibraryUploadModal
              onClose={() => setActiveModal(null)}
              onUploadSuccess={() => {
                setActiveModal(null);
                // Optionally refresh library or show success message
              }}
              enableFolderSelection={true}
            />
          )}

          {activeModal === "summary" && (
            <GenerateSummaryModal
              open={true}
              onClose={() => setActiveModal(null)}
              onCreated={() => {
                setActiveModal(null);
                // Optionally navigate or show success message
              }}
            />
          )}

          {activeModal === "mcq" && (
            <GenerateMCQModal
              open={true}
              onClose={() => setActiveModal(null)}
              onCreated={() => {
                setActiveModal(null);
                // Optionally navigate or show success message
              }}
            />
          )}

          {activeModal === "flashcards" && (
            <GenerateFlashcardsModal
              open={true}
              onClose={() => setActiveModal(null)}
              onCreated={() => {
                setActiveModal(null);
                // Optionally navigate or show success message
              }}
            />
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        open={selectedNotification !== null}
        notification={selectedNotification}
        onAcknowledge={handleNotificationAcknowledge}
      />
    </div>
  );
}; // ✅ THIS WAS MISSING

export default function App() {
  return (
    <DemoProvider>
      <SynapseOS />
      <DemoOverlay />
    </DemoProvider>
  );
}
