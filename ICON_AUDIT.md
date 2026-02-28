# Frontend icon audit

**Scope:** `src/` directory.  
**Libraries in package.json:** `lucide-react` (^0.554.0), `react-icons` (^5.5.0). No `@heroicons` package.

**SVG assets:** No `.svg` files under `src/assets/`. Inline SVGs appear in: `LandingFooter.jsx`, `LandingHero.jsx` (logo/circle graphics), `DashboardStatsPreview.jsx` (mini trend chart), `AccuracyTrendChart.jsx`, `PerformancePage.jsx` (charts), `LandingLearning.jsx` (sparkline). These are logos or data viz, not icon sets.

---

## Table: every icon by name

| Icon name | Library | File(s) where used | Context / usage |
|-----------|--------|---------------------|------------------|
| **Activity** | lucide-react | `App.jsx`, `components/LandingFeatures.jsx`, `components/onboarding/StepPrimaryGoal.jsx` | App: sidebar nav "OSCE". LandingFeatures: feature block. StepPrimaryGoal: goal option icon. |
| **AlertCircle** | lucide-react | `components/SummaryFailurePopup.jsx` | Failure/alert popup. |
| **AlertTriangle** | lucide-react | `modules/summaries/SummaryViewer.jsx` | Summary viewer alert/warning. |
| **ArrowLeft** | lucide-react | `components/auth/ForgotPassword.jsx`, `modules/analytics/ReinforcementSession.jsx`, `modules/analytics/pages/ConceptDetailPage.jsx`, `modules/analytics/pages/DeckReportsPage.jsx`, `modules/analytics/pages/DeckRushedMistakesPage.jsx`, `modules/analytics/pages/FileAnalyticsPage.jsx`, `modules/admin/pages/AdminUserDetail.jsx`, `modules/mcq/MCQDeckView.jsx` | Back / previous navigation. |
| **ArrowRight** | lucide-react | `components/auth/Login.jsx`, `components/auth/SignUp.jsx`, `components/LandingPreviewChat.jsx`, `components/onboarding/OnboardingComplete.jsx`, `modules/dashboard/DashboardWelcome.jsx`, `modules/dashboard/DashboardTourCard.jsx`, `modules/Library/FileViewer.jsx` | Login/SignUp submit; CTA arrows; onboarding "Enter Dashboard"; tour button; FileViewer navigation. |
| **ArrowUpLeft** | lucide-react | `modules/Library/LibraryUploadModal.jsx`, `modules/Library/MoveToFolderModal.jsx` | "Move up" / parent folder in upload and move modals. |
| **ArrowLeftRight** | lucide-react | `modules/Library/LibraryCard.jsx` | Move / change category action on library card. |
| **BarChart2** | lucide-react | `App.jsx` | Sidebar nav "Learning". |
| **Bell** | lucide-react | `App.jsx`, `modules/settings/AnnouncementsPanel.jsx` | App: header notifications; AnnouncementsPanel. |
| **Book** | lucide-react | `components/onboarding/StepResourcePreferences.jsx` | Resource preference option. |
| **BookOpen** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `modules/dashboard/DashboardRecentActivity.jsx`, `modules/Tutor/EmptyStatePanel.jsx`, `components/onboarding/StepPrimaryGoal.jsx`, `components/onboarding/StepYearOrSpecialty.jsx`, `modules/summaries/SummaryViewer.jsx` | Sidebar "Summaries"; Quick Action "Generate Summaries"; Recent Activity summary type; EmptyState; onboarding steps; SummaryViewer. |
| **Bookmark** | lucide-react | `modules/Tutor/MessageBubble.jsx` | Bookmark / save message. |
| **Bot** | lucide-react | `modules/Library/DemoAstraChat.jsx`, `modules/Tutor/MessageBubble.jsx`, `modules/summaries/DemoSummaryChat.jsx` | AI/assistant message avatar. |
| **Brain** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `components/LandingFeatures.jsx`, `components/LandingPreviewChat.jsx`, `modules/Library/FileViewer.jsx`, `modules/settings/AstraPreferencesPanel.jsx`, `modules/summaries/SummaryViewer.jsx` | Sidebar "Tutor"; Quick Action "Ask Astra"; LandingFeatures/LandingPreviewChat; FileViewer Astra; Astra prefs; SummaryViewer AI. |
| **Briefcase** | lucide-react | `components/onboarding/StepAccountType.jsx` | Account type option (e.g. professional). |
| **Building2** | lucide-react | `components/onboarding/StepUniversity.jsx` | University / institution field. |
| **Calendar** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx` (via Planner), `modules/planner/PlannerPage.jsx`, `components/onboarding/StepYearOrSpecialty.jsx` | App: sidebar "Planner"; PlannerPage; onboarding. |
| **Check** | lucide-react | `modules/Library/LibraryCard.jsx`, `modules/mcq/GenerateMCQModal.jsx`, `modules/flashcards/GenerateFlashcardsModal.jsx`, `components/onboarding/StepResourcePreferences.jsx`, `components/Select.jsx`, `modules/summaries/GenerateSummaryModal.jsx` | Selected state; dropdown/select checkmark; modal confirm. |
| **CheckCircle** | lucide-react | `components/auth/ResetPassword.jsx`, `components/onboarding/OnboardingComplete.jsx` | Success / completion. |
| **CheckCircle2** | lucide-react | `modules/mcq/MCQDeckView.jsx` | Correct answer indicator. |
| **CheckSquare** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `modules/dashboard/DashboardRecentActivity.jsx`, `components/onboarding/StepPrimaryGoal.jsx`, `modules/Library/FileViewer.jsx` | Sidebar "MCQ"; Quick Action "Generate MCQs"; Recent Activity MCQ type; onboarding; FileViewer MCQ. |
| **ChevronDown** | lucide-react | `modules/Library/FileViewer.jsx`, `modules/summaries/SummaryViewer.jsx`, `modules/summaries/GenerateSummaryModal.jsx`, `modules/mcq/GenerateMCQModal.jsx`, `modules/flashcards/GenerateFlashcardsModal.jsx`, `components/Select.jsx`, `components/onboarding/StepCountry.jsx`, `components/onboarding/StepYearOrSpecialty.jsx` | Dropdowns; collapsible sections; select open state. |
| **ChevronLeft** | lucide-react | `modules/Library/FileViewer.jsx`, `modules/summaries/SummaryViewer.jsx`, `modules/flashcards/ReviewScreen.jsx`, `modules/planner/PlannerPage.jsx` | Side panel toggle; flashcard prev; planner month prev. |
| **ChevronRight** | lucide-react | `modules/Library/FileViewer.jsx`, `modules/summaries/SummaryViewer.jsx`, `modules/flashcards/ReviewScreen.jsx`, `modules/planner/PlannerPage.jsx` | Side panel toggle; flashcard next; planner month next. |
| **ChevronUp** | lucide-react | `modules/Library/FileViewer.jsx`, `modules/summaries/SummaryViewer.jsx` | Collapsible section expanded state. |
| **Clock** | lucide-react | `modules/Tutor/TopicTabsBar.jsx`, `modules/planner/PlannerPage.jsx` | Topic/session time; planner time. |
| **Clock3** | lucide-react | `modules/mcq/MCQDeckView.jsx` | Timer / elapsed time in MCQ. |
| **Copy** | lucide-react | `modules/Tutor/MessageBubble.jsx`, `modules/mcq/MCQTab.jsx`, `components/UnifiedCard.jsx`, `modules/summaries/SummaryViewer.jsx` | Copy action (message, deck, card, summary). |
| **Download** | lucide-react | `components/UnifiedCard.jsx`, `modules/summaries/SummaryViewer.jsx` | Download action. |
| **Edit2** | lucide-react | `modules/mcq/MCQTab.jsx`, `modules/Tutor/PreviousTopicsPanel.jsx`, `components/UnifiedCard.jsx`, `modules/summaries/SummaryViewer.jsx` | Edit / rename. |
| **Edit3** | lucide-react | `modules/Library/FileViewer.jsx`, `modules/Library/LibraryCard.jsx` | Inline edit (FileViewer, library card). |
| **Eye** | lucide-react | `modules/mcq/MCQEntryModal.jsx`, `modules/Library/LibraryCard.jsx` | View / preview. |
| **File** | lucide-react | `modules/Library/LibraryUploadModal.jsx`, `modules/Library/LibraryCard.jsx` | File type / document. |
| **FileText** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `modules/dashboard/DashboardRecentActivity.jsx`, `modules/Tutor/EmptyStatePanel.jsx`, `modules/Library/FileViewer.jsx` | App: sidebar "Content" (admin) / "Summaries" (user); Recent uploads; EmptyState; FileViewer. |
| **Folder** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `modules/Library/LibraryUploadModal.jsx`, `modules/Library/MoveToFolderModal.jsx`, `modules/mcq/MCQTab.jsx`, `modules/Library/LibraryCard.jsx` | Sidebar "Library" / "Files" (admin); Quick Action "Open Library"; upload/move folder; MCQ folders; library folder. |
| **FolderOpen** | lucide-react | `modules/Library/LibraryCard.jsx` | Open folder state on library card. |
| **FolderPlus** | lucide-react | `modules/Library/LibraryFilters.jsx` | New folder. |
| **Globe** | lucide-react | `components/onboarding/StepCountry.jsx` | Country selector. |
| **GraduationCap** | lucide-react | `components/onboarding/StepAccountType.jsx` | Account type (student). |
| **HelpCircle** | lucide-react | `modules/Tutor/EmptyStatePanel.jsx`, `components/HelpPopup.jsx`, `components/SummaryFailurePopup.jsx` | Help / empty state; failure popup. |
| **Hexagon** | lucide-react | `App.jsx` | Imported only; not used in JSX (dead import). |
| **Home** | lucide-react | `App.jsx` | Sidebar "Dashboard" and admin "Home". |
| **Info** | lucide-react | `components/SourceAttribution.jsx` | Source / attribution info. |
| **Layers** | lucide-react | `modules/Tutor/ChatSidebar.jsx` | Sidebar sessions / layers. |
| **Lightbulb** | lucide-react | `modules/Tutor/EmptyStatePanel.jsx` | Suggestion / idea in empty state. |
| **List** | lucide-react | `modules/summaries/SummaryViewer.jsx` | List view or outline. |
| **Loader2** | lucide-react | `modules/Library/LibraryUploadModal.jsx`, `components/ChangePasswordModal.jsx`, `components/auth/ForgotPassword.jsx`, `components/auth/ResetPassword.jsx`, `components/onboarding/StepUniversity.jsx` | Loading spinner. |
| **LayoutGrid** | lucide-react | `modules/Library/FileViewer.jsx` | Grid view / page layout mode. |
| **Lock** | lucide-react | `App.jsx`, `components/auth/Login.jsx`, `components/auth/SignUp.jsx`, `components/auth/ResetPassword.jsx`, `components/ChangePasswordModal.jsx` | App: "Change Password" in account menu; auth fields and modals. |
| **Mail** | lucide-react | `components/auth/Login.jsx`, `components/auth/SignUp.jsx`, `components/auth/ForgotPassword.jsx` | Email input. |
| **MessageSquare** | lucide-react | `App.jsx`, `modules/Tutor/PreviousTopicsPanel.jsx`, `modules/settings/FeedbackBox.jsx` | App: admin "Suggestions"; Tutor topics; feedback. |
| **Mic** | lucide-react | `App.jsx`, `modules/Tutor/ChatWindow.jsx` | Sidebar "Oral Exam"; chat voice input. |
| **MoreHorizontal** | lucide-react | `modules/summaries/SummariesTab.jsx`, `components/LandingPreviewChat.jsx`, `components/UnifiedCard.jsx`, `modules/summaries/SummaryViewer.jsx` | More / overflow menu (tabs, cards, summary). |
| **MoreVertical** | lucide-react | `modules/Library/LibraryCard.jsx` | Card actions menu. |
| **Paperclip** | lucide-react | `modules/Tutor/ChatWindow.jsx`, `modules/planner/PlannerPage.jsx` | Attach file; planner attachment. |
| **Pen** | lucide-react | `modules/Library/FileViewer.jsx` | Annotate / draw. |
| **Play** | lucide-react | `modules/mcq/MCQEntryModal.jsx` | Start / play MCQ. |
| **Plus** | lucide-react | `modules/Tutor/ChatSidebar.jsx`, `modules/Tutor/TopicTabsBar.jsx`, `modules/summaries/SummariesTab.jsx`, `modules/mcq/MCQTab.jsx`, `modules/flashcards/FlashcardsTab.jsx`, `modules/Library/LibraryFilters.jsx`, `modules/planner/PlannerPage.jsx` | New session/tab/deck/folder/event. |
| **RefreshCw** | lucide-react | `modules/admin/AdminPanel.jsx`, `modules/mcq/MCQEntryModal.jsx`, `components/SummaryFailurePopup.jsx` | Refresh / retry. |
| **RotateCcw** | lucide-react | `modules/mcq/MCQEntryModal.jsx`, `modules/Library/FileViewer.jsx` | Reset / rotate (MCQ reset; viewer rotate). |
| **Search** | lucide-react | `modules/summaries/SummariesTab.jsx`, `modules/mcq/MCQTab.jsx`, `modules/flashcards/FlashcardsTab.jsx`, `components/onboarding/StepCountry.jsx`, `components/onboarding/StepPrimaryGoal.jsx`, `components/onboarding/StepYearOrSpecialty.jsx` | Search field. |
| **Scroll** | lucide-react | `modules/Library/FileViewer.jsx` | Scroll mode / continuous scroll. |
| **Send** | lucide-react | `modules/Library/DemoAstraChat.jsx`, `modules/Tutor/ChatWindow.jsx`, `modules/summaries/DemoSummaryChat.jsx`, `modules/summaries/SummaryViewer.jsx`, `modules/mcq/MCQDeckView.jsx` | Send message. |
| **Settings** | lucide-react | `App.jsx` | Sidebar "Settings". |
| **Share2** | lucide-react | `modules/mcq/MCQDeckList.jsx`, `modules/mcq/MCQDeckView.jsx`, `modules/flashcards/DeckCard.jsx` | Share deck. |
| **Sparkles** | lucide-react | `modules/dashboard/DashboardWelcome.jsx`, `modules/dashboard/DashboardTourCard.jsx`, `modules/summaries/DemoSummaryChat.jsx`, `modules/summaries/SummaryViewer.jsx` | Tour / AI / highlight. |
| **Star** | lucide-react | `modules/flashcards/DeckCard.jsx` | Favorite / star on. |
| **StarOff** | lucide-react | `modules/flashcards/DeckCard.jsx` | Unfavorite / star off. |
| **Stethoscope** | lucide-react | `components/onboarding/StepAccountType.jsx`, `modules/summaries/SummaryViewer.jsx` | Medical / clinician account type; summary context. |
| **Tag** | lucide-react | `modules/Library/FileViewer.jsx` | Tag / label. |
| **Target** | lucide-react | `components/onboarding/StepPrimaryGoal.jsx` | Goal / target option. |
| **Trash2** | lucide-react | `modules/Tutor/PreviousTopicsPanel.jsx`, `modules/mcq/MCQTab.jsx`, `components/UnifiedCard.jsx`, `modules/flashcards/DeckCard.jsx`, `modules/summaries/SummaryViewer.jsx`, `modules/Library/LibraryCard.jsx` | Delete. |
| **TrendingUp** | lucide-react | `modules/dashboard/DashboardStatsPreview.jsx` | Performance trend (section title / concept). |
| **Upload** | lucide-react | `modules/dashboard/DashboardQuickActions.jsx`, `modules/summaries/SummariesTab.jsx`, `modules/mcq/MCQTab.jsx`, `modules/flashcards/FlashcardsTab.jsx` | Upload action. |
| **UploadCloud** | lucide-react | `modules/Library/LibraryUploadModal.jsx` | Upload area / cloud upload. |
| **User** | lucide-react | `components/auth/SignUp.jsx`, `components/onboarding/StepAccountType.jsx` | SignUp field; account type (generic user). |
| **Users** | lucide-react | `App.jsx` | Admin sidebar "Users". |
| **Volume2** | lucide-react | `modules/Tutor/MessageBubble.jsx` | Read aloud / TTS. |
| **X** | lucide-react | `modules/Library/LibraryUploadModal.jsx`, `modules/Library/MoveToFolderModal.jsx`, `modules/Library/RenameModal.jsx`, `modules/summaries/GenerateSummaryModal.jsx`, `components/ChangePasswordModal.jsx`, `components/HelpPopup.jsx`, `components/LegalModal.jsx`, `components/SummaryFailurePopup.jsx`, `modules/Tutor/PreviousTopicsPanel.jsx`, `modules/Tutor/TopicTabsBar.jsx`, `components/onboarding/StepUniversity.jsx`, `modules/Library/FileViewer.jsx`, `modules/planner/PlannerPage.jsx` | Close modal / panel / chip. |
| **XCircle** | lucide-react | `modules/mcq/MCQDeckView.jsx` | Wrong answer indicator. |
| **Zap** | lucide-react | `App.jsx`, `modules/dashboard/DashboardQuickActions.jsx`, `modules/dashboard/DashboardRecentActivity.jsx`, `components/LandingFeatures.jsx`, `modules/Library/FileViewer.jsx` | Sidebar "Flashcards"; Quick Action "Generate Flashcards"; Recent Activity flashcards type; LandingFeatures; FileViewer flashcards. |
| **ZoomIn** | lucide-react | `modules/Library/FileViewer.jsx` | Zoom in. |
| **ZoomOut** | lucide-react | `modules/Library/FileViewer.jsx` | Zoom out. |
| **HiChevronLeft** | react-icons (hi) | `modules/Tutor/ChatSidebar.jsx` | Collapse sidebar (show chevron when collapsed). |
| **HiChevronRight** | react-icons (hi) | `modules/Tutor/ChatSidebar.jsx` | Expand sidebar (show chevron when expanded). |

---

## Summary

- **Lucide-react:** All icons in the table above except **HiChevronLeft** and **HiChevronRight**. One dead import: **Hexagon** in `App.jsx`.
- **React Icons (hi):** Only **HiChevronLeft** and **HiChevronRight** in `ChatSidebar.jsx` for sidebar collapse/expand.
- **No Heroicons package** in package.json; no `@heroicons` imports.
- **No SVG icon assets** in `src/assets/`. Inline SVGs in `src` are used for logos and charts, not as icon sets.
