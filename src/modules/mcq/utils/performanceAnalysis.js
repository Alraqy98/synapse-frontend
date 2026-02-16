/**
 * Performance Analysis for MCQ Attempts
 * Pure deterministic analysis - no backend, no LLM, no API calls.
 * 
 * Provides chess.com-style performance insights based on in-memory attempt data.
 */

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values) {
    if (!values || values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

/**
 * Analyze MCQ attempt performance
 * 
 * @param {Object} params
 * @param {Object} params.stats - { total, correct, percent, totalTime, avgTime }
 * @param {Object} params.answers - keyed by questionId: { selectedLetter, isCorrect, timeSpent, ... }
 * @param {Array} params.questions - array of question objects
 * @param {Object} params.progress - optional progress object
 * @returns {Object} - { summary, signals, insights, suggestions }
 */
export function analyzeAttempt({ stats, answers, questions, progress }) {
    // Guard: Handle empty or invalid data
    if (!stats || !answers || !questions) {
        return {
            summary: "Unable to analyze: insufficient data.",
            signals: {},
            insights: [],
            suggestions: []
        };
    }

    const answerList = Object.values(answers);
    
    // Filter valid time entries (exclude null/undefined/0)
    const timesAll = answerList
        .map(a => a.timeSpent)
        .filter(t => t != null && t > 0);
    
    const correctAnswers = answerList.filter(a => a.isCorrect);
    const incorrectAnswers = answerList.filter(a => !a.isCorrect);
    
    const timesCorrect = correctAnswers
        .map(a => a.timeSpent)
        .filter(t => t != null && t > 0);
    
    const timesIncorrect = incorrectAnswers
        .map(a => a.timeSpent)
        .filter(t => t != null && t > 0);

    // Calculate key signals
    const avgCorrectTime = timesCorrect.length > 0
        ? Math.round(timesCorrect.reduce((s, t) => s + t, 0) / timesCorrect.length)
        : 0;
    
    const avgIncorrectTime = timesIncorrect.length > 0
        ? Math.round(timesIncorrect.reduce((s, t) => s + t, 0) / timesIncorrect.length)
        : 0;
    
    const timeStdDev = timesAll.length > 1
        ? Math.round(calculateStdDev(timesAll))
        : 0;
    
    const fastestSec = timesAll.length > 0 ? Math.min(...timesAll) : 0;
    const slowestSec = timesAll.length > 0 ? Math.max(...timesAll) : 0;

    // Rushed mistakes: incorrect answers where timeSpent < avgTime * 0.75
    const rushedThreshold = stats.avgTime * 0.75;
    const rushedMistakes = incorrectAnswers.filter(
        a => a.timeSpent != null && a.timeSpent > 0 && a.timeSpent < rushedThreshold
    );
    const rushedMistakesCount = rushedMistakes.length;

    // Overthinking correct: correct answers where timeSpent > avgTime * 1.5
    const overthinkingThreshold = stats.avgTime * 1.5;
    const overthinkingCorrect = correctAnswers.filter(
        a => a.timeSpent != null && a.timeSpent > 0 && a.timeSpent > overthinkingThreshold
    );
    const overthinkingCorrectCount = overthinkingCorrect.length;

    // Build signals object
    const signals = {
        rushedMistakesCount,
        overthinkingCorrectCount,
        avgCorrectTime,
        avgIncorrectTime,
        timeStdDev,
        fastestSec,
        slowestSec
    };

    // Generate insights based on profile classification
    const insights = [];
    const suggestions = [];

    // Profile: Impulsive under uncertainty
    if (stats.percent < 60 && avgIncorrectTime > 0 && avgIncorrectTime < avgCorrectTime) {
        insights.push({
            title: "Impulsive under uncertainty",
            detail: `Incorrect answers were faster (${avgIncorrectTime}s avg) than correct ones (${avgCorrectTime}s avg). This suggests rushing when uncertain.`,
            severity: "high"
        });
        suggestions.push({
            title: "Slow down on unfamiliar questions",
            detail: "When uncertain, spend extra time eliminating wrong answers before selecting."
        });
    }

    // Profile: Struggling but trying (knowledge gap)
    if (stats.percent < 60 && avgIncorrectTime > 0 && avgIncorrectTime >= avgCorrectTime) {
        insights.push({
            title: "Knowledge gap detected",
            detail: `Time spent on incorrect answers (${avgIncorrectTime}s avg) suggests effort, but accuracy is low (${stats.percent}%). This indicates content gaps.`,
            severity: "high"
        });
        suggestions.push({
            title: "Review foundational concepts",
            detail: "Focus on understanding core material before attempting more questions."
        });
    }

    // Profile: Hesitant but correct
    if (stats.percent >= 75 && overthinkingCorrectCount > stats.total * 0.25) {
        insights.push({
            title: "Hesitant but correct",
            detail: `${overthinkingCorrectCount} correct answers took longer than average. You know the material but may be second-guessing.`,
            severity: "low"
        });
        suggestions.push({
            title: "Trust your initial judgment",
            detail: "Your accuracy is strong. Build confidence by trusting first instincts on familiar topics."
        });
    }

    // Profile: Strong and stable
    if (stats.percent >= 85 && timeStdDev < stats.avgTime * 0.4) {
        insights.push({
            title: "Strong and stable performance",
            detail: `High accuracy (${stats.percent}%) with consistent pacing (±${timeStdDev}s variation). This indicates mastery.`,
            severity: "low"
        });
        suggestions.push({
            title: "Maintain consistency",
            detail: "Your current approach is working well. Consider increasing difficulty or moving to new topics."
        });
    }

    // Rushed mistakes insight
    if (rushedMistakesCount > 0) {
        insights.push({
            title: "Rushed mistakes",
            detail: `${rushedMistakesCount} incorrect answer${rushedMistakesCount > 1 ? 's' : ''} answered in under ${Math.round(rushedThreshold)}s (75% of avg). Speed may be compromising accuracy.`,
            severity: rushedMistakesCount >= stats.total * 0.2 ? "high" : "med"
        });
        if (!suggestions.some(s => s.title.includes("Slow down"))) {
            suggestions.push({
                title: "Allocate minimum time per question",
                detail: "Set a floor of 15-20 seconds to read carefully, even on seemingly easy questions."
            });
        }
    }

    // High variability insight
    if (timeStdDev > stats.avgTime * 0.8 && stats.total > 3) {
        insights.push({
            title: "Inconsistent pacing",
            detail: `Time per question varies widely (±${timeStdDev}s). Some questions took ${slowestSec}s while others ${fastestSec}s.`,
            severity: "med"
        });
        suggestions.push({
            title: "Develop consistent time strategy",
            detail: "Aim for predictable pacing. Budget similar time for similar question types."
        });
    }

    // Generate summary
    let summary = "";
    if (stats.percent >= 85) {
        summary = `Strong performance with ${stats.percent}% accuracy. ${insights.length > 0 ? "Minor optimizations possible." : "Excellent work."}`;
    } else if (stats.percent >= 70) {
        summary = `Solid performance at ${stats.percent}%. ${insights.length > 0 ? "Key areas for improvement identified." : ""}`;
    } else if (stats.percent >= 50) {
        summary = `${stats.percent}% accuracy suggests room for improvement. ${insights.length > 0 ? "Review insights below." : ""}`;
    } else {
        summary = `${stats.percent}% accuracy indicates significant knowledge gaps. Focus on foundational review.`;
    }

    return {
        summary,
        signals,
        insights,
        suggestions
    };
}
