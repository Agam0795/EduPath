import React, { useState, useEffect, useCallback } from 'react';
import { studentsAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

const BRANCHES = ['B.Sc. Mathematics (Honours)', 'B.Sc. Computer Science', 'B.Tech CSE', 'B.Tech IT', 'BCA', 'MCA'];

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button onClick={onClose} className="modal-close"><FiX /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const StudentForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    studentId: '', name: '', email: '', password: '', semester: 1, branch: BRANCHES[0]
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Student ID *</label>
        <input value={form.studentId} onChange={e => set('studentId', e.target.value)} placeholder="STU2303179" />
      </div>
      <div className="form-group">
        <label>Full Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Agam Sharma" />
      </div>
      <div className="form-group">
        <label>Email *</label>
        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" />
      </div>
      {!initial && (
        <div className="form-group">
          <label>Password *</label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
        </div>
      )}
      <div className="form-group">
        <label>Semester</label>
        <select value={form.semester} onChange={e => set('semester', Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Branch</label>
        <select value={form.branch} onChange={e => set('branch', e.target.value)}>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Student'}
        </button>
      </div>
    </div>
  );
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const fetchStudents = useCallback(async () => {
    setError('');
    try {
      const res = await studentsAPI.getAll({ search, branch: branchFilter });
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, branchFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSave = async (form) => {
    try {
      if (editing) {
        await studentsAPI.update(editing._id, form);
      } else {
        await studentsAPI.create(form);
      }
      setShowModal(false);
      setEditing(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await studentsAPI.delete(id);
      fetchStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Management</h1>
            <p className="page-subtitle">{students.length} students enrolled</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }} id="add-student-btn">
            <FiPlus size={16} /> Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-box">
            <FiSearch size={16} />
            <input
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="student-search"
            />
            {search && <button onClick={() => setSearch('')}><FiX size={14} /></button>}
          </div>
          <div className="filter-select">
            <FiFilter size={16} />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} id="branch-filter">
              <option value="">All Branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="table-responsive">
            {loading ? (
              <div className="loading-state"><div className="spinner-large"></div></div>
            ) : (
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Semester</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan="7" className="empty-row">No students found</td></tr>
                  ) : (
                    students.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div className="student-row">
                            <div className="mini-avatar">{s.name.slice(0, 2).toUpperCase()}</div>
                            <span>{s.name}</span>
                          </div>
                        </td>
                        <td><code>{s.studentId}</code></td>
                        <td>{s.email}</td>
                        <td><span className="branch-tag">{s.branch}</span></td>
                        <td>Sem {s.semester}</td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="icon-btn edit-btn"
                              onClick={() => { setEditing(s); setShowModal(true); }}
                              id={`edit-student-${s._id}`}
                              title="Edit"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              className="icon-btn delete-btn"
                              onClick={() => handleDelete(s._id, s.name)}
                              id={`delete-student-${s._id}`}
                              title="Delete"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <Modal
            title={editing ? `Edit: ${editing.name}` : 'Add New Student'}
            onClose={() => { setShowModal(false); setEditing(null); }}
          >
            <StudentForm
              initial={editing}
              onSave={handleSave}
              onCancel={() => { setShowModal(false); setEditing(null); }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
