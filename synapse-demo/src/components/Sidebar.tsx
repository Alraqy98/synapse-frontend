import React from "react";
import { BRAND } from "../brand";
import AppLogo from "../../../src/components/AppLogo";

const ICON_SIZE = 24;
const SIDEBAR_WIDTH = 56;
const GAP = 8;

const iconStyle = (active: boolean) => ({
  width: ICON_SIZE,
  height: ICON_SIZE,
  color: active ? BRAND.primary : "rgba(255,255,255,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const FolderIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const BrainIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const LightningIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const CheckboxIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const BookIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const WaveformIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <polyline points="1 6 1 18 4 18 4 6 7 18 7 6 10 18 10 6 13 18 13 6 16 18 16 6 19 18 19 6 22 18 22 6" />
  </svg>
);
const MicrophoneIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const BarChartIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const BellIcon = ({ active }: { active: boolean }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(active)}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ICONS = [
  { id: "home", Icon: HomeIcon },
  { id: "folder", Icon: FolderIcon },
  { id: "brain", Icon: BrainIcon },
  { id: "lightning", Icon: LightningIcon },
  { id: "checkbox", Icon: CheckboxIcon },
  { id: "book", Icon: BookIcon },
  { id: "waveform", Icon: WaveformIcon },
  { id: "microphone", Icon: MicrophoneIcon },
  { id: "calendar", Icon: CalendarIcon },
  { id: "barchart", Icon: BarChartIcon },
  { id: "settings", Icon: SettingsIcon },
  { id: "bell", Icon: BellIcon },
];

export type SidebarActive =
  | "home"
  | "folder"
  | "brain"
  | "lightning"
  | "checkbox"
  | "book"
  | "waveform"
  | "microphone"
  | "calendar"
  | "barchart"
  | "settings"
  | "bell";

export const Sidebar: React.FC<{ active: SidebarActive }> = ({ active }) => {
  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: "100%",
        background: BRAND.sidebarBg,
        borderRight: `1px solid ${BRAND.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 16,
        gap: GAP,
      }}
    >
      <div style={{ width: 32, height: 32, flexShrink: 0 }}>
        <AppLogo size={32} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: GAP, alignItems: "center" }}>
        {ICONS.map(({ id, Icon }) => (
          <div key={id} style={{ width: ICON_SIZE, height: ICON_SIZE }}>
            <Icon active={active === id} />
          </div>
        ))}
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: BRAND.primary,
          color: BRAND.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
        }}
      >
        MA
      </div>
    </div>
  );
};
