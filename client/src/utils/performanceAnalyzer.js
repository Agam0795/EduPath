export function analyzePerformance(subjects, globalThreshold = 40) {
  return subjects.map(subject => {
    const percentage = (subject.marksObtained / subject.maxMarks) * 100;
    const threshold = subject.threshold || globalThreshold;
    const isWeak = percentage < threshold;
    const grade = calculateGrade(subject.marksObtained, subject.maxMarks);
    return {
      ...subject,
      percentage: Math.round(percentage * 10) / 10,
      isWeak,
      grade
    };
  });
}

export function calculateGrade(obtained, max) {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'O';
  if (pct >= 75) return 'A+';
  if (pct >= 60) return 'A';
  if (pct >= 50) return 'B+';
  if (pct >= 40) return 'B';
  return 'F';
}

export function calculateCGPA(marksArray) {
  if (!marksArray.length) return 0;
  const gradePoints = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, F: 0 };
  const analyzed = marksArray.flatMap(m => analyzePerformance(m.subjects));
  const total = analyzed.reduce((sum, s) => sum + (gradePoints[s.grade] || 0), 0);
  return Math.round((total / analyzed.length) * 100) / 100;
}

export function getPerformanceTrend(allMarks) {
  return allMarks
    .sort((a, b) => a.semester - b.semester)
    .map(m => {
      const analyzed = analyzePerformance(m.subjects);
      const avg = analyzed.reduce((s, sub) => s + sub.percentage, 0) / analyzed.length;
      return { semester: m.semester, avgPercentage: Math.round(avg * 10) / 10 };
    });
}

export function getGradeColor(grade) {
  const map = { O: '#16A34A', 'A+': '#2563EB', A: '#0891B2', 'B+': '#7C3AED', B: '#D97706', F: '#DC2626' };
  return map[grade] || '#6B7280';
}

export function getScoreColor(percentage) {
  if (percentage >= 75) return '#16A34A';
  if (percentage >= 60) return '#0891B2';
  if (percentage >= 50) return '#D97706';
  if (percentage >= 40) return '#F59E0B';
  return '#DC2626';
}
