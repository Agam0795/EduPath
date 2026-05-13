import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marksAPI } from '../../services/api';
import { analyzePerformance, getScoreColor, getGradeColor } from '../../utils/performanceAnalyzer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiFilter } from 'react-icons/fi';
import Sidebar from './Sidebar';

const ViewMarks = () => {
  const { user } = useAuth();
  const [allMarks, setAllMarks] = useState([]);
  const [selectedSem, setSelectedSem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await marksAPI.getByStudent(user._id);
        const marks = res.data.marks || [];
        setAllMarks(marks);
        if (marks.length) setSelectedSem(marks[0].semester);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchMarks();
    // subscribe to SSE for live updates
    let es;
    if (user?._id) {
      try {
        es = new EventSource(`${process.env.REACT_APP_API_BASE || ''}/sse/marks/${user._id}`);
        es.onmessage = async (e) => {
          try {
            await marksAPI.getByStudent(user._id).then(r => {
              const marks = r.data.marks || [];
              setAllMarks(marks);
              setSelectedSem(prev => (prev || !marks.length ? prev : marks[0].semester));
            });
          } catch (err) { console.error('SSE refresh error', err); }
        };
      } catch (err) {
        console.warn('SSE unavailable', err);
      }
    }
    return () => { if (es) es.close(); };
  }, [user]);

  const currentMarks = allMarks.find(m => m.semester === selectedSem);
  const analyzed = currentMarks ? analyzePerformance(currentMarks.subjects) : [];
  const avgPct = analyzed.length ? (analyzed.reduce((s, sub) => s + sub.percentage, 0) / analyzed.length).toFixed(1) : 0;
  const weakCount = analyzed.filter(s => s.isWeak).length;
  const passCount = analyzed.filter(s => !s.isWeak).length;

  const chartData = analyzed.map(s => ({
    name: s.subjectCode,
    score: s.percentage,
    full: s.subjectName
  }));

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Marks</h1>
            <p className="page-subtitle">Detailed subject-wise performance analysis</p>
          </div>
          <div className="header-actions">
            <div className="sem-selector">
              <FiFilter size={16} />
              <select
                value={selectedSem || ''}
                onChange={e => setSelectedSem(Number(e.target.value))}
                id="semester-filter"
              >
                {allMarks.map(m => (
                  <option key={m.semester} value={m.semester}>Semester {m.semester}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner-large"></div><p>Loading marks...</p></div>
        ) : analyzed.length === 0 ? (
          <div className="empty-state-card">
            <FiAlertCircle size={48} style={{ color: '#D97706' }} />
            <h3>No Marks Available</h3>
            <p>Your marks haven't been uploaded yet. Please check with your administrator.</p>
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <div className="marks-summary-row">
              <div className="summary-pill summary-blue">
                <span className="sum-val">{avgPct}%</span>
                <span className="sum-label">Average</span>
              </div>
              <div className="summary-pill summary-green">
                <span className="sum-val">{passCount}</span>
                <span className="sum-label">Passed</span>
              </div>
              <div className="summary-pill summary-red">
                <span className="sum-val">{weakCount}</span>
                <span className="sum-label">Weak</span>
              </div>
              <div className="summary-pill summary-gray">
                <span className="sum-val">{analyzed.length}</span>
                <span className="sum-label">Subjects</span>
              </div>
            </div>

            {/* Chart */}
            <div className="card">
              <h2 className="card-title" style={{ padding: '1rem 1.5rem 0' }}>Score Distribution</h2>
              <div style={{ padding: '1rem' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      formatter={(v) => [`${v}%`, 'Score']}
                      labelFormatter={(l) => chartData.find(d => d.name === l)?.full || l}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={getScoreColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Marks Table */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Semester {selectedSem} — Detailed Marks</h2>
              </div>
              <div className="table-responsive">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Subject Name</th>
                      <th>Code</th>
                      <th>Marks Obtained</th>
                      <th>Max Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyzed.map((sub, idx) => (
                      <tr key={idx} className={sub.isWeak ? 'row-weak' : 'row-pass'}>
                        <td>{idx + 1}</td>
                        <td className="subject-name">{sub.subjectName}</td>
                        <td><code>{sub.subjectCode}</code></td>
                        <td>
                          <div className="marks-bar-wrap">
                            <span>{sub.marksObtained}</span>
                            <div className="marks-bar">
                              <div
                                className="marks-bar-fill"
                                style={{ width: `${sub.percentage}%`, background: getScoreColor(sub.percentage) }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>{sub.maxMarks}</td>
                        <td>
                          <span className="pct-badge" style={{ background: getScoreColor(sub.percentage) + '20', color: getScoreColor(sub.percentage) }}>
                            {sub.percentage}%
                          </span>
                        </td>
                        <td>
                          <span className="grade-chip" style={{ background: getGradeColor(sub.grade) + '20', color: getGradeColor(sub.grade) }}>
                            {sub.grade}
                          </span>
                        </td>
                        <td>
                          {sub.isWeak
                            ? <span className="status-badge status-fail"><FiAlertCircle size={12} /> Below Threshold</span>
                            : <span className="status-badge status-pass"><FiCheckCircle size={12} /> Pass</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewMarks;
