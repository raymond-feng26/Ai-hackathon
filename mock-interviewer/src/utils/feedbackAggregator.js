export function aggregateFeedback(grades) {
  if (!grades || grades.length === 0) {
    return { strengths: [], weaknesses: [], suggestions: [] };
  }
  return {
    strengths: [...new Set(grades.flatMap(g => g.strengths || []))].slice(0, 5),
    weaknesses: [...new Set(grades.flatMap(g => g.weaknesses || g.improvements || []))].slice(0, 5),
    suggestions: [...new Set(grades.flatMap(g => g.suggestions || []))].slice(0, 3)
  };
}
