import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, studentsAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiUsers, FiBook, FiMapPin, FiAlertCircle, FiTrendingUp, FiActivity } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ovRes, subRes, stuRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getSubjects(),
          studentsAPI.getAll({ limit: 5 })
        ]);
        setOverview(ovRes.data.stats);
        setSubjectStats(subRes.data.subjects || []);
        setRecentStudents(stuRes.data.students?.slice(0, 5) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const passFailData = [
    { name: 'Passed', value: subjectStats.reduce((s, sub) => s + sub.pass, 0) },
    { name: 'Failed', value: subjectStats.reduce((s, sub) => s + sub.fail, 0) }
  ];

  if (loading) return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content"><div className="loading-state"><div className="spinner-large"></div><p>Loading dashboard...</p></div></div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Overview of EduPath Navigator system</p>
          </div>
          <div className="header-badge">
            <span className="admin-badge">👑 Administrator</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <Link to="/admin/students" className="stat-card stat-blue no-underline">
            <div className="stat-icon"><FiUsers /></div>
            <div className="stat-content">
              <p className="stat-label">Total Students</p>
              <h3 className="stat-value">{overview?.totalStudents || 0}</h3>
              <p className="stat-sub">Enrolled learners</p>
            </div>
          </Link>
          <Link to="/admin/books" className="stat-card stat-purple no-underline">
            <div className="stat-icon"><FiBook /></div>
            <div className="stat-content">
              <p className="stat-label">Total Books</p>
              <h3 className="stat-value">{overview?.totalBooks || 0}</h3>
              <p className="stat-sub">In catalog</p>
            </div>
          </Link>
          <Link to="/admin/libraries" className="stat-card stat-green no-underline">
            <div className="stat-icon"><FiMapPin /></div>
            <div className="stat-content">
              <p className="stat-label">Libraries</p>
              <h3 className="stat-value">{overview?.totalLibraries || 0}</h3>
              <p className="stat-sub">Locations mapped</p>
            </div>
          </Link>
          <div className="stat-card stat-red">
            <div className="stat-icon"><FiAlertCircle /></div>
            <div className="stat-content">
              <p className="stat-label">Students at Risk</p>
              <h3 className="stat-value">{overview?.weakStudents || 0}</h3>
              <p className="stat-sub">Below threshold</p>
            </div>
          </div>
          <div className="stat-card stat-teal">
            <div className="stat-icon"><FiTrendingUp /></div>
            <div className="stat-content">
              <p className="stat-label">Average Score</p>
              <h3 className="stat-value">{overview?.avgScore || 0}%</h3>
              <p className="stat-sub">Across all subjects</p>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon"><FiActivity /></div>
            <div className="stat-content">
              <p className="stat-label">Branches</p>
              <h3 className="stat-value">{overview?.branches || 0}</h3>
              <p className="stat-sub">Academic programs</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2">
          {/* Subject Avg Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Subject Average Scores</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subjectStats} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subjectCode" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(v, n) => [`${v}%`, n === 'avgScore' ? 'Average' : n]}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="avgScore" name="Average Score" radius={[4, 4, 0, 0]}>
                  {subjectStats.map((entry, idx) => (
                    <Cell key={idx} fill={entry.avgScore >= 40 ? '#2563EB' : '#DC2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pass/Fail Pie */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Pass / Fail Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {passFailData.map((entry, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#16A34A' : '#DC2626'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Stats Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Subject-wise Statistics</h2>
            <Link to="/admin/analytics" className="view-all-link">Full Analytics →</Link>
          </div>
          <div className="table-responsive">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Avg Score</th>
                  <th>Pass</th>
                  <th>Fail</th>
                  <th>Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((sub, idx) => (
                  <tr key={idx}>
                    <td className="subject-name">{sub.subjectName}</td>
                    <td><code>{sub.subjectCode}</code></td>
                    <td>
                      <span className={`pct-badge ${sub.avgScore < 40 ? 'pct-red' : 'pct-green'}`}>
                        {sub.avgScore}%
                      </span>
                    </td>
                    <td style={{ color: '#16A34A', fontWeight: 600 }}>{sub.pass}</td>
                    <td style={{ color: '#DC2626', fontWeight: 600 }}>{sub.fail}</td>
                    <td>
                      <div className="pass-rate-bar">
                        <div className="pass-rate-fill" style={{ width: `${sub.passRate}%` }}></div>
                        <span>{sub.passRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Students */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Students</h2>
            <Link to="/admin/students" className="view-all-link">Manage All →</Link>
          </div>
          <div className="table-responsive">
            <table className="marks-table">
              <thead>
                <tr><th>Name</th><th>Student ID</th><th>Branch</th><th>Semester</th><th>Email</th></tr>
              </thead>
              <tbody>
                {recentStudents.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="student-row">
                        <div className="mini-avatar">{s.name.slice(0, 2).toUpperCase()}</div>
                        {s.name}
                      </div>
                    </td>
                    <td><code>{s.studentId}</code></td>
                    <td>{s.branch}</td>
                    <td>Sem {s.semester}</td>
                    <td>{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
