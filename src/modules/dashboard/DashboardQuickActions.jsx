// src/modules/dashboard/DashboardQuickActions.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Folder, Brain, BookOpen, CheckSquare, Zap } from "lucide-react";

const ACTIONS = [
  {
    label: "Upload Files",
    description: "Add new study materials",
    icon: Upload,
    accent: "#00C8B4",
    glow: "rgba(0,200,180,0.12)",
    border: "rgba(0,200,180,0.18)",
    key: "upload",
  },
  {
    label: "Open Library",
    description: "Browse and organize your files",
    icon: Folder,
    accent: "#3F7CFF",
    glow: "rgba(63,124,255,0.12)",
    border: "rgba(63,124,255,0.18)",
    key: "library",
  },
  {
    label: "Ask Astra",
    description: "Chat with your AI tutor",
    icon: Brain,
    accent: "#7A6CFF",
    glow: "rgba(122,108,255,0.12)",
    border: "rgba(122,108,255,0.18)",
    key: "astra",
  },
  {
    label: "Generate Summaries",
    description: "Create structured AI summaries",
    icon: BookOpen,
    accent: "#00C8B4",
    glow: "rgba(0,200,180,0.12)",
    border: "rgba(0,200,180,0.18)",
    key: "summary",
  },
  {
    label: "Generate MCQs",
    description: "Build practice question decks",
    icon: CheckSquare,
    accent: "#F5A623",
    glow: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.18)",
    key: "mcq",
  },
  {
    label: "Generate Flashcards",
    description: "Create spaced repetition decks",
    icon: Zap,
    accent: "#5BFFA8",
    glow: "rgba(91,255,168,0.12)",
    border: "rgba(91,255,168,0.18)",
    key: "flashcards",
  },
];

const ActionCard = ({ action, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "20px 22px",
        borderRadius: 16,
        background: hovered
          ? `rgba(255,255,255,0.04)`
          : "rgba(13,15,18,0.7)",
        border: `1px solid ${hovered ? action.border : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s cubic-bezier(0.23,1,0.32,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 32px ${action.glow}` : "none",
        overflow: "hidden",
      }}
    >
      {/* Subtle background glow on hover */}
      {hovered && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at top left, ${action.glow}, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          padding: 10,
          borderRadius: 10,
          background: hovered ? action.glow : "rgba(255,255,255,0.04)",
          border: `1px solid ${hovered ? action.border : "rgba(255,255,255,0.06)"}`,
          transition: "all 0.2s",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Icon size={20} style={{ color: hovered ? action.accent : "rgba(245,245,247,0.5)", transition: "color 0.2s" }} />
      </div>

      {/* Text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: hovered ? "#F5F5F7" : "rgba(245,245,247,0.85)",
            marginBottom: 4,
            transition: "color 0.2s",
          }}
        >
          {action.label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(245,245,247,0.4)",
            lineHeight: 1.4,
          }}
        >
          {action.description}
        </div>
      </div>
    </button>
  );
};

const DashboardQuickActions = ({
  onOpenUploadModal,
  onOpenSummaryModal,
  onOpenMCQModal,
  onOpenFlashcardsModal,
}) => {
  const navigate = useNavigate();

  const handlers = {
    upload: onOpenUploadModal,
    library: () => navigate("/library"),
    astra: () => navigate("/tutor"),
    summary: onOpenSummaryModal,
    mcq: onOpenMCQModal,
    flashcards: onOpenFlashcardsModal,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(245,245,247,0.3)",
          }}
        >
          Quick Actions
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {ACTIONS.map((action) => (
          <ActionCard
            key={action.key}
            action={action}
            onClick={handlers[action.key]}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
