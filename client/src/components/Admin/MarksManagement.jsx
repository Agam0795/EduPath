import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { studentsAPI, marksAPI } from '../../services/api';
import { analyzePerformance } from '../../utils/performanceAnalyzer';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUpload, FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

const SUBJECTS = [
  { code: 'MAT601', name: 'Linear Algebra' },
  { code: 'MAT602', name: 'Real Analysis' },
  { code: 'CSM601', name: 'Software Engineering' },
  { code: 'CSM603', name: 'Machine Intelligence' },
  { code: 'CSM604', name: 'Data Mining' },
];

const MARKS_HEADERS = {
  studentId: ['Student ID', 'studentId', 'StudentId'],
  semester: ['Semester', 'semester', 'Sem'],
  subjectCode: ['Subject Code', 'subjectCode', 'Code'],
  subjectName: ['Subject Name', 'subjectName', 'Subject'],
  marksObtained: ['Marks Obtained', 'marksObtained', 'Marks'],
  maxMarks: ['Max Marks', 'maxMarks', 'Maximum Marks'],
  threshold: ['Threshold', 'threshold', 'Pass Mark'],
  academicYear: ['Academic Year', 'academicYear', 'Year'],
};

const getCellValue = (row, keys, fallback = '') => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
};

const buildMarksRow = (row) => {
  const studentId = String(getCellValue(row, MARKS_HEADERS.studentId, '')).trim();
  const semester = Number(getCellValue(row, MARKS_HEADERS.semester, ''));
  const subjectCode = String(getCellValue(row, MARKS_HEADERS.subjectCode, '')).trim();
  const subjectName = String(getCellValue(row, MARKS_HEADERS.subjectName, '')).trim();
  const marksObtained = Number(getCellValue(row, MARKS_HEADERS.marksObtained, ''));
  const maxMarks = Number(getCellValue(row, MARKS_HEADERS.maxMarks, 100));
  const threshold = Number(getCellValue(row, MARKS_HEADERS.threshold, 40));
  const academicYear = String(getCellValue(row, MARKS_HEADERS.academicYear, '2023-24')).trim();

  if (!studentId || Number.isNaN(semester) || !subjectCode || !subjectName || Number.isNaN(marksObtained)) {
    return null;
  }

  return {
    studentId,
    semester,
    subjectCode,
    subjectName,
    marksObtained,
    maxMarks: Number.isNaN(maxMarks) ? 100 : maxMarks,
    threshold: Number.isNaN(threshold) ? 40 : threshold,
    academicYear: academicYear || '2023-24',
  };
};

const MarksManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMarks, setEditingMarks] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [excelImporting, setExcelImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [newMarksForm, setNewMarksForm] = useState({
    semester: 6,
    subjects: SUBJECTS.map(s => ({ subjectCode: s.code, subjectName: s.name, marksObtained: 0, maxMarks: 100, threshold: 40 }))
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentsAPI.getAll({ search });
        setStudents(res.data.students || []);
      } catch (err) { console.error(err); }
    };
    fetchStudents();
  }, [search]);

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setShowAddForm(false);
    setEditingMarks(null);
    try {
      const res = await marksAPI.getByStudent(student._id);
      setStudentMarks(res.data.marks || []);
    } catch (err) { console.error(err); }
  };

  const handleSaveMarks = async () => {
    try {
      const payload = { studentId: selectedStudent._id, ...newMarksForm };
      if (editingMarks) {
        await marksAPI.update(editingMarks._id, payload);
      } else {
        await marksAPI.create(payload);
      }
      const res = await marksAPI.getByStudent(selectedStudent._id);
      setStudentMarks(res.data.marks || []);
      setShowAddForm(false);
      setEditingMarks(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save marks');
    }
  };

  const handleDeleteMarks = async (id) => {
    if (!window.confirm('Delete this marks record?')) return;
    await marksAPI.delete(id);
    const res = await marksAPI.getByStudent(selectedStudent._id);
    setStudentMarks(res.data.marks || []);
  };

  const handleCSVUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      const res = await marksAPI.uploadCSV(formData);
      setUploadMsg(`✅ ${res.data.message}`);
      setUploadFile(null);
      if (selectedStudent) {
        const mr = await marksAPI.getByStudent(selectedStudent._id);
        setStudentMarks(mr.data.marks || []);
      }
    } catch (err) {
      setUploadMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const exportMarksToExcel = () => {
    const rows = (studentMarks || []).flatMap(record =>
      (record.subjects || []).map(subject => ({
        'Student ID': selectedStudent?.studentId || '',
        Semester: record.semester,
        'Subject Code': subject.subjectCode,
        'Subject Name': subject.subjectName,
        'Marks Obtained': subject.marksObtained,
        'Max Marks': subject.maxMarks,
        Threshold: subject.threshold,
        'Academic Year': record.academicYear || '2023-24',
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks');
    XLSX.writeFile(workbook, `marks-export-${selectedStudent?.studentId || 'student'}.xlsx`);
  };

  const downloadMarksTemplate = () => {
    const templateRows = [
      {
        'Student ID': 'STU2303179',
        Semester: 6,
        'Subject Code': 'MAT601',
        'Subject Name': 'Linear Algebra',
        'Marks Obtained': 75,
        'Max Marks': 100,
        Threshold: 40,
        'Academic Year': '2023-24',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks Template');
    XLSX.writeFile(workbook, 'marks-management-template.xlsx');
  };

  const openExcelImportDialog = () => {
    fileInputRef.current?.click();
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelImporting(true);
    setUploadMsg('');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rows.length) {
        setUploadMsg('❌ No rows found in the uploaded Excel file');
        return;
      }

      const studentLookup = new Map(students.map(student => [student.studentId, student]));
      let imported = 0;
      let skipped = 0;

      for (const row of rows) {
        const payload = buildMarksRow(row);
        if (!payload) {
          skipped += 1;
          continue;
        }

        const student = studentLookup.get(payload.studentId);
        if (!student) {
          skipped += 1;
          continue;
        }

        try {
          const existing = await marksAPI.getByStudent(student._id);
          const existingRecord = (existing.data.marks || []).find(record => record.semester === payload.semester);
          const subjectEntry = {
            subjectCode: payload.subjectCode,
            subjectName: payload.subjectName,
            marksObtained: payload.marksObtained,
            maxMarks: payload.maxMarks,
            threshold: payload.threshold,
          };

          if (existingRecord) {
            const updatedSubjects = [...existingRecord.subjects];
            const subjectIndex = updatedSubjects.findIndex(subject => subject.subjectCode === payload.subjectCode);
            if (subjectIndex >= 0) updatedSubjects[subjectIndex] = subjectEntry;
            else updatedSubjects.push(subjectEntry);

            await marksAPI.update(existingRecord._id, {
              studentId: student._id,
              semester: payload.semester,
              subjects: updatedSubjects,
              academicYear: payload.academicYear,
            });
          } else {
            await marksAPI.create({
              studentId: student._id,
              semester: payload.semester,
              subjects: [subjectEntry],
              academicYear: payload.academicYear,
            });
          }

          imported += 1;
        } catch (err) {
          skipped += 1;
        }
      }

      setUploadMsg(`✅ Imported ${imported} marks row${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}`);
      if (selectedStudent) {
        const refreshed = await marksAPI.getByStudent(selectedStudent._id);
        setStudentMarks(refreshed.data.marks || []);
      }
    } catch (err) {
      setUploadMsg(`❌ ${err.response?.data?.message || err.message || 'Excel import failed'}`);
    } finally {
      setExcelImporting(false);
      event.target.value = '';
    }
  };

  const updateSubjectMark = (idx, field, value) => {
    setNewMarksForm(f => ({
      ...f,
      subjects: f.subjects.map((s, i) => i === idx ? { ...s, [field]: Number(value) } : s)
    }));
  };

  const startEdit = (marksRecord) => {
    setEditingMarks(marksRecord);
    setNewMarksForm({ semester: marksRecord.semester, subjects: marksRecord.subjects });
    setShowAddForm(true);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Marks Management</h1>
            <p className="page-subtitle">Upload, edit, and analyze student marks</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={openExcelImportDialog} disabled={excelImporting} id="import-marks-excel-btn">
              <FiUpload size={16} /> {excelImporting ? 'Importing...' : 'Import Excel'}
            </button>
            <button className="btn btn-outline" onClick={exportMarksToExcel} disabled={!selectedStudent || !studentMarks.length} id="export-marks-excel-btn">
              <FiDownload size={16} /> Export Excel
            </button>
            <button className="btn btn-outline" onClick={downloadMarksTemplate} id="template-marks-excel-btn">
              <FiDownload size={16} /> Download Template
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelImport}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* CSV Upload Section */}
        <div className="card upload-card">
          <h3 className="card-title">📤 Bulk Upload via CSV</h3>
          <p className="upload-hint">CSV columns: studentId, semester, subjectCode, subjectName, marksObtained, maxMarks, threshold</p>
          <div className="upload-row">
            <input
              type="file"
              accept=".csv"
              onChange={e => setUploadFile(e.target.files[0])}
              id="csv-upload-input"
            />
            <button className="btn btn-primary" onClick={handleCSVUpload} disabled={!uploadFile || uploading} id="upload-csv-btn">
              <FiUpload size={16} /> {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
          {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}
        </div>

        <div className="marks-mgmt-layout">
          {/* Student List */}
          <div className="card student-list-panel">
            <div className="card-header">
              <h3 className="card-title">Students</h3>
            </div>
            <div className="search-box" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
              <FiSearch size={14} />
              <input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="student-list-items">
              {students.map(s => (
                <div
                  key={s._id}
                  className={`student-list-item ${selectedStudent?._id === s._id ? 'selected' : ''}`}
                  onClick={() => selectStudent(s)}
                  id={`student-list-item-${s._id}`}
                >
                  <div className="mini-avatar sm">{s.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <p className="item-name">{s.name}</p>
                    <p className="item-sub">{s.studentId} · Sem {s.semester}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marks Panel */}
          <div className="marks-detail-panel">
            {!selectedStudent ? (
              <div className="card empty-state-card">
                <FiAlertCircle size={40} style={{ color: '#D97706', marginBottom: '1rem' }} />
                <p>Select a student from the left to view or manage their marks</p>
              </div>
            ) : (
              <>
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{selectedStudent.name}</h3>
                      <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{selectedStudent.studentId} · {selectedStudent.branch}</p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setEditingMarks(null); setNewMarksForm({ semester: selectedStudent.semester, subjects: SUBJECTS.map(s => ({ subjectCode: s.code, subjectName: s.name, marksObtained: 0, maxMarks: 100, threshold: 40 })) }); setShowAddForm(true); }}
                      id="add-marks-btn"
                    >
                      <FiPlus size={14} /> Add Marks
                    </button>
                  </div>

                  {/* Add/Edit Form */}
                  {showAddForm && (
                    <div className="marks-form">
                      <div className="form-row">
                        <label>Semester</label>
                        <select value={newMarksForm.semester} onChange={e => setNewMarksForm(f => ({ ...f, semester: Number(e.target.value) }))}>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                      <div className="marks-entry-table">
                        <table className="marks-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Code</th>
                              <th>Marks</th>
                              <th>Max</th>
                              <th>Threshold</th>
                            </tr>
                          </thead>
                          <tbody>
                            {newMarksForm.subjects.map((sub, idx) => (
                              <tr key={idx}>
                                <td>{sub.subjectName}</td>
                                <td><code>{sub.subjectCode}</code></td>
                                <td>
                                  <input
                                    type="number" min="0" max="100"
                                    value={sub.marksObtained}
                                    onChange={e => updateSubjectMark(idx, 'marksObtained', e.target.value)}
                                    className="marks-input"
                                    id={`marks-input-${idx}`}
                                  />
                                </td>
                                <td>
                                  <input type="number" min="1" value={sub.maxMarks} onChange={e => updateSubjectMark(idx, 'maxMarks', e.target.value)} className="marks-input" />
                                </td>
                                <td>
                                  <input type="number" min="1" value={sub.threshold} onChange={e => updateSubjectMark(idx, 'threshold', e.target.value)} className="marks-input" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="form-actions" style={{ marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => { setShowAddForm(false); setEditingMarks(null); }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveMarks} id="save-marks-btn">
                          {editingMarks ? 'Update Marks' : 'Save Marks'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Marks Records */}
                {studentMarks.map(record => {
                  const analyzed = analyzePerformance(record.subjects);
                  const avg = analyzed.reduce((s, sub) => s + sub.percentage, 0) / (analyzed.length || 1);
                  return (
                    <div key={record._id} className="card" style={{ marginTop: '1rem' }}>
                      <div className="card-header">
                        <h3 className="card-title">Semester {record.semester}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="pct-badge pct-blue">{avg.toFixed(1)}% avg</span>
                          <button className="icon-btn edit-btn" onClick={() => startEdit(record)} title="Edit"><FiEdit2 size={14} /></button>
                          <button className="icon-btn delete-btn" onClick={() => handleDeleteMarks(record._id)} title="Delete"><FiTrash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="marks-table">
                          <thead>
                            <tr><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Status</th></tr>
                          </thead>
                          <tbody>
                            {analyzed.map((sub, idx) => (
                              <tr key={idx} className={sub.isWeak ? 'row-weak' : ''}>
                                <td>{sub.subjectName} <code style={{ fontSize: '0.75rem' }}>({sub.subjectCode})</code></td>
                                <td>{sub.marksObtained}/{sub.maxMarks}</td>
                                <td><span className={`pct-badge ${sub.isWeak ? 'pct-red' : 'pct-green'}`}>{sub.percentage}%</span></td>
                                <td><span className="grade-chip">{sub.grade}</span></td>
                                <td>
                                  {sub.isWeak
                                    ? <span className="status-badge status-fail"><FiAlertCircle size={11} /> Weak</span>
                                    : <span className="status-badge status-pass"><FiCheckCircle size={11} /> Pass</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                {studentMarks.length === 0 && !showAddForm && (
                  <div className="card empty-state-card" style={{ marginTop: '1rem' }}>
                    <p>No marks records found. Click "Add Marks" to create one.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksManagement;
