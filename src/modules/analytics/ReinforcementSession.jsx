import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useLearningState from "./hooks/useLearningState";
import TraceabilityPanel from "./TraceabilityPanel";
import SessionExecutionUI from "../learning/ReinforcementSession";
import api from "../../lib/api";

export default function ReinforcementSession() {
  const { conceptId, sessionId } = useParams();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  // Restore session from DB if sessionId is in URL
  useEffect(() => {
    const restoreSession = async () => {
      if (!sessionId || sessionData) return;

      setIsLoadingSession(true);
      try {
        const response = await api.get(`/api/learning/reinforcement-session/${sessionId}`);

        if (response.data?.success && response.data?.data) {
          setSessionData(response.data.data);
        } else {
          // Session not found - navigate back to prep screen
          navigate(`/learning/reinforce/${conceptId}`, { replace: true });
        }
      } catch (err) {
        console.error("Failed to restore session from DB:", err);
        setSessionError("Failed to load session");
        // Navigate back to prep screen
        navigate(`/learning/reinforce/${conceptId}`, { replace: true });
      } finally {
        setIsLoadingSession(false);
      }
    };

    restoreSession();
  }, [sessionId, conceptId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause learning state polling when session is active
  const { data: learningState, loading, status, error, refresh } = useLearningState({ 
    passive: true,
    enabled: !sessionData 
  });

  console.log("ReinforcementSession - loading:", loading, "status:", status, "hasData:", !!learningState);

  // Safety fallback: if loading or no snapshot, show gentle message (but only if no active session)
  if (!sessionData && (loading || !learningState)) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/learning")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Learning Status
        </button>
        
        <div className="panel p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4E9E7A]/10 border border-[#4E9E7A]/25 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#4E9E7A] animate-pulse" />
            <span className="font-mono text-xs text-[#4E9E7A] tracking-wider">PREPARING</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Preparing your session...
          </h2>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Loading your learning profile and concept analytics.
          </p>
        </div>
      </div>
    );
  }

  // Extract concept data from learning state
  const conceptData = learningState?.concept_breakdown?.find(
    c => c.concept_id === conceptId
  );
  
  const primaryRisk = learningState?.primary_risk;
  const prescription = learningState?.prescription;
  const primaryRiskEvidence = learningState?.primary_risk_evidence || [];
  
  const conceptName = conceptData?.concept_name || primaryRisk?.concept_name || "Unknown Concept";
  const accuracy = conceptData?.accuracy ?? primaryRisk?.accuracy ?? 0;
  const attempts = conceptData?.attempts ?? primaryRisk?.attempts ?? 0;
  const riskLevel = primaryRisk?.risk_level || "MODERATE_RISK";
  const duration = prescription?.duration_minutes || 15;

  // Mastery level classification (simple heuristic)
  const getMasteryLevel = (acc) => {
    if (acc < 40) return { level: 0, label: "Foundational" };
    if (acc < 70) return { level: 1, label: "Developing" };
    return { level: 2, label: "Proficient" };
  };

  const mastery = getMasteryLevel(accuracy);

  const handleStartSession = async () => {
    setIsLoadingSession(true);
    setSessionError(null);

    try {
      const response = await api.post("/api/learning/reinforcement-session", {
        primary_concept_id: conceptId,
      });

      if (response.data?.success && response.data?.data) {
        const session = response.data.data;
        // Navigate to URL with session_id - this will trigger session restore
        navigate(`/learning/reinforce/${conceptId}/session/${session.session_id}`);
      } else {
        setSessionError("Failed to create reinforcement session");
      }
    } catch (err) {
      console.error("Failed to start reinforcement session:", err);
      setSessionError(err.response?.data?.message || err.message || "Failed to start session");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSessionComplete = () => {
    // Navigate back to prep screen (strips session_id from URL)
    navigate(`/learning/reinforce/${conceptId}`);
    
    setSessionData(null);
    // Optionally refresh learning state
    if (refresh) {
      refresh();
    }
  };

  // If session is active, show session execution UI
  if (sessionData) {
    return (
      <SessionExecutionUI
        sessionData={sessionData}
        onComplete={handleSessionComplete}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/learning")}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Learning Status
      </button>

      <div className="panel overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#111114]/50 border-b border-white/[0.07]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white mb-2">
                {conceptName}
              </h1>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-1 rounded bg-white/[0.05] border border-white/[0.1] text-white/50">
                  Level {mastery.level} · {mastery.label}
                </span>
                <span 
                  className="font-mono text-xs px-2 py-1 rounded border"
                  style={{
                    backgroundColor: riskLevel === "HIGH_RISK" ? "#E55A4E15" : "#C4A84F15",
                    borderColor: riskLevel === "HIGH_RISK" ? "#E55A4E30" : "#C4A84F30",
                    color: riskLevel === "HIGH_RISK" ? "#E55A4E" : "#C4A84F",
                  }}
                >
                  {riskLevel === "HIGH_RISK" ? "High Risk" : riskLevel === "MODERATE_RISK" ? "Moderate Risk" : "Low Risk"}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="font-mono text-xs text-white/30 mb-1 tracking-wider">ROLLING ACCURACY</div>
              <div className="font-mono text-lg text-white">{accuracy}%</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/30 mb-1 tracking-wider">EXPOSURE COUNT</div>
              <div className="font-mono text-lg text-white">{attempts}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/30 mb-1 tracking-wider">SESSION DURATION</div>
              <div className="font-mono text-lg text-white">{duration} min</div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="px-6 py-5 bg-[#111114]/30 border-b border-white/[0.07]">
          <p className="text-sm text-white/70 leading-relaxed m-0">
            You struggled with this concept recently. A short focused session will reinforce memory traces 
            and help stabilize performance in this area.
          </p>
        </div>

        {/* Traceability */}
        {primaryRiskEvidence.length > 0 && (
          <div className="px-6 py-5 bg-[#111114]/30 border-b border-white/[0.07]">
            <TraceabilityPanel 
              primaryRiskEvidence={primaryRiskEvidence}
              primaryConceptName={conceptName}
            />
          </div>
        )}

        {/* Action */}
        <div className="px-6 py-6 bg-[#0F1612]">
          {sessionError && (
            <div className="mb-4 p-3 rounded-lg bg-[#E55A4E]/10 border border-[#E55A4E]/30 text-sm text-[#E55A4E]">
              {sessionError}
            </div>
          )}
          <button
            onClick={handleStartSession}
            disabled={isLoadingSession}
            className="w-full px-6 py-4 rounded-lg bg-[#4E9E7A] hover:bg-[#5BAE8C] text-[#0C0C0E] font-semibold text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingSession ? "Generating Questions..." : `Start ${duration} Minute Session`}
          </button>
          <p className="text-center text-xs text-white/35 mt-3 m-0">
            Targeted questions will be generated based on your error patterns
          </p>
        </div>
      </div>
    </div>
  );
}
