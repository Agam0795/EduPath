import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { marksAPI, recommendationsAPI } from '../../services/api';
import { analyzePerformance, calculateCGPA, getPerformanceTrend } from '../../utils/performanceAnalyzer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiBook, FiMapPin, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiAward } from 'react-icons/fi';
import Sidebar from './Sidebar';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marksRes, recRes] = await Promise.all([
          marksAPI.getByStudent(user._id),
          recommendationsAPI.getByStudent(user._id)
        ]);
        setMarks(marksRes.data.marks || []);
        setRecommendations(recRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchData();
    // subscribe to server-sent events for real-time marks updates
    let es;
    if (user?._id) {
      try {
        es = new EventSource(`${process.env.REACT_APP_API_BASE || ''}/sse/marks/${user._id}`);
        es.onmessage = async (e) => {
          try {
            JSON.parse(e.data);
            // on any marks event refresh marks
            await marksAPI.getByStudent(user._id).then(r => setMarks(r.data.marks || []));
          } catch (err) { console.error('SSE parse/refresh error', err); }
        };
      } catch (err) {
        console.warn('SSE not available', err);
      }
    }
    return () => { if (es) es.close(); };
  }, [user]);

  const latestMarks = marks[0];
  const analyzed = latestMarks ? analyzePerformance(latestMarks.subjects) : [];
  const cgpa = calculateCGPA(marks);
  const weakCount = analyzed.filter(s => s.isWeak).length;
  const avgPct = analyzed.length ? Math.round(analyzed.reduce((s, sub) => s + sub.percentage, 0) / analyzed.length) : 0;
  const trend = getPerformanceTrend(marks);

  const barData = analyzed.map(s => ({
    name: s.subjectCode,
    Marks: s.marksObtained,
    Max: s.maxMarks,
    fill: s.isWeak ? '#DC2626' : '#2563EB'
  }));

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar role="student" />
        <div className="main-content">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">{user?.branch} · Semester {user?.semester}</p>
          </div>
          <div className="header-badge">
            <span className="student-id-badge">{user?.studentId}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <div className="stat-icon"><FiTrendingUp /></div>
            <div className="stat-content">
              <p className="stat-label">Average Score</p>
              <h3 className="stat-value">{avgPct}%</h3>
              <p className="stat-sub">Semester {latestMarks?.semester || user?.semester}</p>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon"><FiAward /></div>
            <div className="stat-content">
              <p className="stat-label">CGPA</p>
              <h3 className="stat-value">{cgpa}/10</h3>
              <p className="stat-sub">Overall performance</p>
            </div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-icon"><FiAlertCircle /></div>
            <div className="stat-content">
              <p className="stat-label">Weak Subjects</p>
              <h3 className="stat-value">{weakCount}</h3>
              <p className="stat-sub">Need improvement</p>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon"><FiBook /></div>
            <div className="stat-content">
              <p className="stat-label">Recommendations</p>
              <h3 className="stat-value">{recommendations?.recommendations?.reduce((s, r) => s + r.books.length, 0) || 0}</h3>
              <p className="stat-sub">Books suggested</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          {/* Subject Performance Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Subject Performance</h2>
              <span className="semester-tag">Sem {latestMarks?.semester}</span>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(v, n) => [v, n === 'Marks' ? 'Marks Obtained' : 'Max Marks']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  {barData.map((entry, idx) => (
                    <Bar key={idx} dataKey="Marks" fill={entry.fill} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No marks data available</div>
            )}
          </div>

          {/* Performance Trend */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Performance Trend</h2>
              <span className="all-sem-tag">All Semesters</span>
            </div>
            {trend.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semester" tickFormatter={v => `Sem ${v}`} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Avg Score']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="avgPercentage" stroke="#2563EB" strokeWidth={3} dot={{ r: 5, fill: '#2563EB' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">Need data from multiple semesters</div>
            )}
          </div>
        </div>

        {/* Subject Summary Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Subject Summary — Semester {latestMarks?.semester}</h2>
            <Link to="/student/marks" className="view-all-link">View Detailed Marks →</Link>
          </div>
          {analyzed.length > 0 ? (
            <div className="table-responsive">
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Marks</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzed.map((sub, idx) => (
                    <tr key={idx} className={sub.isWeak ? 'row-weak' : 'row-pass'}>
                      <td className="subject-name">{sub.subjectName}</td>
                      <td><code>{sub.subjectCode}</code></td>
                      <td>{sub.marksObtained}/{sub.maxMarks}</td>
                      <td>
                        <span className={`pct-badge ${sub.isWeak ? 'pct-red' : 'pct-green'}`}>
                          {sub.percentage}%
                        </span>
                      </td>
                      <td><span className={`grade-badge grade-${sub.grade.replace('+','p')}`}>{sub.grade}</span></td>
                      <td>
                        {sub.isWeak
                          ? <span className="status-badge status-fail"><FiAlertCircle /> Weak</span>
                          : <span className="status-badge status-pass"><FiCheckCircle /> Pass</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No marks data available for this semester.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/student/recommendations" className="action-card action-orange">
            <FiBook size={28} />
            <span>Book Recommendations</span>
            <small>{weakCount} weak subjects</small>
          </Link>
          <Link to="/student/library" className="action-card action-blue">
            <FiMapPin size={28} />
            <span>Find Library</span>
            <small>Navigate nearby</small>
          </Link>
          <Link to="/student/marks" className="action-card action-green">
            <FiTrendingUp size={28} />
            <span>Full Marks Report</span>
            <small>Detailed analysis</small>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
