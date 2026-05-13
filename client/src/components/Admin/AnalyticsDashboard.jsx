import React, { useState, useEffect } from 'react';
import { analyticsAPI, recommendationsAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

const AnalyticsDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subRes, recRes] = await Promise.all([
          analyticsAPI.getSubjects(),
          recommendationsAPI.getStats()
        ]);
        setSubjects(subRes.data.subjects || []);
        setSubjectStats(recRes.data.subjectStats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const radarData = subjects.map(s => ({
    subject: s.subjectCode,
    avg: s.avgScore,
    pass: s.passRate
  }));

  const passFailData = subjects.map(s => ({
    name: s.subjectCode,
    Pass: s.pass,
    Fail: s.fail
  }));

  const weakestSubjects = [...subjects].sort((a, b) => a.avgScore - b.avgScore).slice(0, 3);
  const strongestSubjects = [...subjects].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);

  if (loading) return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content"><div className="loading-state"><div className="spinner-large"></div></div></div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics Dashboard</h1>
            <p className="page-subtitle">Performance insights across all students and subjects</p>
          </div>
        </div>

        {/* Insights Row */}
        <div className="insights-row">
          <div className="insight-card insight-red">
            <div className="insight-icon"><FiTrendingDown /></div>
            <div>
              <p className="insight-label">Weakest Subject</p>
              <p className="insight-val">{weakestSubjects[0]?.subjectName || '—'}</p>
              <p className="insight-sub">{weakestSubjects[0]?.avgScore || 0}% avg</p>
            </div>
          </div>
          <div className="insight-card insight-green">
            <div className="insight-icon"><FiTrendingUp /></div>
            <div>
              <p className="insight-label">Strongest Subject</p>
              <p className="insight-val">{strongestSubjects[0]?.subjectName || '—'}</p>
              <p className="insight-sub">{strongestSubjects[0]?.avgScore || 0}% avg</p>
            </div>
          </div>
          <div className="insight-card insight-orange">
            <div className="insight-icon"><FiAlertCircle /></div>
            <div>
              <p className="insight-label">Subjects Below 50%</p>
              <p className="insight-val">{subjects.filter(s => s.avgScore < 50).length}</p>
              <p className="insight-sub">Need attention</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          {/* Pass/Fail Stacked Bar */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Pass vs Fail by Subject</h2></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={passFailData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="Pass" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Fail" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Performance Radar</h2></div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Average Score" dataKey="avg" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                <Radar name="Pass Rate" dataKey="pass" stroke="#16A34A" fill="#16A34A" fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Subject Table */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Detailed Subject Analytics</h2></div>
          <div className="table-responsive">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Avg Score</th>
                  <th>Max Score</th>
                  <th>Min Score</th>
                  <th>Pass</th>
                  <th>Fail</th>
                  <th>Pass Rate</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="subject-name">{sub.subjectName}</td>
                    <td><code>{sub.subjectCode}</code></td>
                    <td><span className={`pct-badge ${sub.avgScore < 40 ? 'pct-red' : sub.avgScore < 60 ? 'pct-orange' : 'pct-green'}`}>{sub.avgScore}%</span></td>
                    <td>{sub.maxScore}%</td>
                    <td>{sub.minScore}%</td>
                    <td style={{ color: '#16A34A', fontWeight: 600 }}>{sub.pass}</td>
                    <td style={{ color: '#DC2626', fontWeight: 600 }}>{sub.fail}</td>
                    <td>
                      <div className="pass-rate-bar">
                        <div className="pass-rate-fill" style={{ width: `${sub.passRate}%` }}></div>
                        <span>{sub.passRate}%</span>
                      </div>
                    </td>
                    <td>
                      {sub.passRate >= 70
                        ? <span className="health-badge health-good">✅ Good</span>
                        : sub.passRate >= 50
                        ? <span className="health-badge health-warn">⚠️ Warning</span>
                        : <span className="health-badge health-bad">🔴 Critical</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation Stats */}
        {subjectStats.length > 0 && (
          <div className="card">
            <div className="card-header"><h2 className="card-title">Recommendation Insights</h2></div>
            <div className="rec-insights-grid">
              {subjectStats.map((s, idx) => (
                <div key={idx} className="rec-insight-card">
                  <div className="ric-header">
                    <code className="ric-code">{s.subjectCode}</code>
                    <span className="ric-weak" style={{ background: '#DC262615', color: '#DC2626' }}>
                      {s.weak}/{s.total} weak
                    </span>
                  </div>
                  <p className="ric-name">{s.subjectName}</p>
                  <div className="ric-bar">
                    <div className="ric-fill" style={{ width: `${s.weakPercent}%` }}></div>
                  </div>
                  <p className="ric-pct">{s.weakPercent}% of students below threshold</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
