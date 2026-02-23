import React, { useState, useEffect } from "react";
import api from "../../lib/api";

export default function ReinforcementPlanPanel({ primaryConceptId, onStartSession }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!primaryConceptId) {
      setLoading(false);
      setError("No primary concept ID provided");
      return;
    }

    const fetchReinforcementPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post("/api/learning/reinforcement-plan", {
          primary_concept_id: primaryConceptId,
        });

        if (response.data?.success && response.data?.data) {
          setPlan(response.data.data);
        } else {
          setError("Failed to load reinforcement plan");
        }
      } catch (err) {
        console.error("Failed to fetch reinforcement plan:", err);
        setError(err.response?.data?.message || err.message || "Failed to load reinforcement plan");
      } finally {
        setLoading(false);
      }
    };

    fetchReinforcementPlan();
  }, [primaryConceptId]);

  const getConfidenceBadgeStyle = (confidence) => {
    if (confidence === "high") {
      return {
        backgroundColor: "var(--teal-dim)",
        color: "var(--teal)",
        borderColor: "var(--teal)",
      };
    } else if (confidence === "medium") {
      return {
        backgroundColor: "rgba(234, 179, 8, 0.10)",
        color: "#fbbf24",
        borderColor: "#fbbf24",
      };
    } else {
      return {
        backgroundColor: "rgba(239, 68, 68, 0.10)",
        color: "#f87171",
        borderColor: "#f87171",
      };
    }
  };

  const handleStartSession = () => {
    if (plan && onStartSession) {
      onStartSession(plan);
    }
  };

  if (loading) {
    return (
      <div
        className="panel"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Loading reinforcement plan...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="panel"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}
      >
        <div style={{ color: "#f87171", fontSize: "14px" }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div
        className="panel"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius)",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          No reinforcement plan available
        </div>
      </div>
    );
  }

  return (
    <div
      className="panel animate-fade-in"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius)",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--text-main)",
            marginBottom: "8px",
          }}
        >
          Reinforcement Plan
        </h3>
        {plan.primary_concept_name && (
          <div
            style={{
              fontSize: "14px",
              color: "var(--teal)",
              fontWeight: 500,
            }}
          >
            {plan.primary_concept_name}
          </div>
        )}
      </div>

      {/* Explanation Block */}
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          background: "rgba(0, 0, 0, 0.2)",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Summary */}
        {plan.summary && (
          <div
            style={{
              fontSize: "14px",
              color: "var(--text-main)",
              lineHeight: "1.6",
              marginBottom: "16px",
            }}
          >
            {plan.summary}
          </div>
        )}

        {/* Drivers List */}
        {plan.drivers && plan.drivers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "8px",
                fontWeight: 500,
              }}
            >
              Key Drivers:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                fontSize: "13px",
                color: "var(--text-main)",
                lineHeight: "1.8",
              }}
            >
              {plan.drivers.map((driver, index) => (
                <li key={index}>{driver}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Badge */}
        {plan.confidence && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Confidence:
            </span>
            <span
              style={{
                ...getConfidenceBadgeStyle(plan.confidence),
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {plan.confidence}
            </span>
          </div>
        )}
      </div>

      {/* Deck Breakdown */}
      {plan.deck && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            background: "rgba(0, 0, 0, 0.15)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-main)",
              marginBottom: "12px",
            }}
          >
            Deck Breakdown
          </div>

          {/* Total Questions */}
          {plan.deck.total_questions !== undefined && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}
            >
              <strong style={{ color: "var(--text-main)" }}>
                {plan.deck.total_questions}
              </strong>{" "}
              questions total
            </div>
          )}

          {/* Concept Cards */}
          {plan.deck.concept_cards && plan.deck.concept_cards.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {plan.deck.concept_cards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "12px",
                    color: "var(--text-main)",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--teal)", fontWeight: 500 }}>
                    {card.concept_id}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {card.count} {card.count === 1 ? "question" : "questions"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      <button
        className="btn-primary"
        onClick={handleStartSession}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "10px",
          cursor: "pointer",
          border: "none",
          background: "var(--teal)",
          color: "#000",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 0 18px rgba(0, 245, 204, 0.45)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Start Reinforcement Session
      </button>
    </div>
  );
}
