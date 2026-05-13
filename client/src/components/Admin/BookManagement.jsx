import React, { useState, useEffect, useCallback } from 'react';
import { booksAPI, librariesAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiBook, FiStar } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

const SUBJECT_CODES = [
  { code: 'MAT601', name: 'Linear Algebra' },
  { code: 'MAT602', name: 'Real Analysis' },
  { code: 'CSM601', name: 'Software Engineering' },
  { code: 'CSM603', name: 'Machine Intelligence' },
  { code: 'CSM604', name: 'Data Mining' },
];

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box wide-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button onClick={onClose} className="modal-close"><FiX /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '', author: '', subject: '', subjectCode: '',
    description: '', isbn: '', rating: 4.5, totalPages: 0,
    publisher: '', year: 2024, availableAt: []
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchBooks = useCallback(async () => {
    try {
      const [bRes, lRes] = await Promise.all([
        booksAPI.getAll({ search, subjectCode: subjectFilter }),
        librariesAPI.getAll()
      ]);
      setBooks(bRes.data.books || []);
      setLibraries(lRes.data.libraries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, subjectFilter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', author: '', subject: '', subjectCode: '', description: '', isbn: '', rating: 4.5, totalPages: 0, publisher: '', year: 2024, availableAt: [] });
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      title: book.title, author: book.author, subject: book.subject, subjectCode: book.subjectCode,
      description: book.description, isbn: book.isbn, rating: book.rating,
      totalPages: book.totalPages, publisher: book.publisher, year: book.year,
      availableAt: book.availableAt?.map(l => l._id || l) || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await booksAPI.update(editing._id, form);
      else await booksAPI.create(form);
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving book');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete book "${title}"?`)) return;
    await booksAPI.delete(id);
    fetchBooks();
  };

  const toggleLib = (libId) => {
    setForm(f => ({
      ...f,
      availableAt: f.availableAt.includes(libId)
        ? f.availableAt.filter(id => id !== libId)
        : [...f.availableAt, libId]
    }));
  };

  const handleSubjectCodeChange = (code) => {
    const subj = SUBJECT_CODES.find(s => s.code === code);
    setForm(f => ({ ...f, subjectCode: code, subject: subj?.name || f.subject }));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Book Management</h1>
            <p className="page-subtitle">{books.length} books in catalog</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} id="add-book-btn">
            <FiPlus size={16} /> Add Book
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-box">
            <FiSearch size={16} />
            <input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')}><FiX size={14} /></button>}
          </div>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} id="subject-code-filter">
            <option value="">All Subjects</option>
            {SUBJECT_CODES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="loading-state"><div className="spinner-large"></div></div>
        ) : (
          <div className="books-admin-grid">
            {books.map(book => (
              <div key={book._id} className="book-admin-card" id={`book-admin-${book._id}`}>
                <div className="book-admin-header">
                  <div className="book-icon-wrap"><FiBook size={24} /></div>
                  <div className="book-admin-actions">
                    <button className="icon-btn edit-btn" onClick={() => openEdit(book)} title="Edit"><FiEdit2 size={14} /></button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(book._id, book.title)} title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="book-admin-title">{book.title}</h3>
                <p className="book-admin-author">by {book.author}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                  <span className="subject-tag-sm">{book.subjectCode}</span>
                  <span className="lib-count-sm">📚 {book.availableAt?.length || 0} libraries</span>
                </div>
                <div className="book-rating-sm">
                  <FiStar size={12} fill="#F59E0B" stroke="#F59E0B" />
                  <span>{book.rating}</span>
                </div>
                {book.isbn && <p className="book-isbn-sm">ISBN: {book.isbn}</p>}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <Modal title={editing ? 'Edit Book' : 'Add New Book'} onClose={() => setShowModal(false)}>
            <div className="form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Book title" />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="Author name(s)" />
              </div>
              <div className="form-group">
                <label>Subject Code *</label>
                <select value={form.subjectCode} onChange={e => handleSubjectCodeChange(e.target.value)}>
                  <option value="">Select subject</option>
                  {SUBJECT_CODES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input value={form.subject} onChange={e => set('subject', e.target.value)} />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input value={form.isbn} onChange={e => set('isbn', e.target.value)} placeholder="978-..." />
              </div>
              <div className="form-group">
                <label>Publisher</label>
                <input value={form.publisher} onChange={e => set('publisher', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Rating (0–5)</label>
                <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', Number(e.target.value))} />
              </div>
              <div className="form-group form-full">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group form-full">
                <label>Available at Libraries (select multiple)</label>
                <div className="lib-checkboxes">
                  {libraries.map(lib => (
                    <label key={lib._id} className="lib-checkbox">
                      <input
                        type="checkbox"
                        checked={form.availableAt.includes(lib._id)}
                        onChange={() => toggleLib(lib._id)}
                        id={`lib-check-${lib._id}`}
                      />
                      <span>{lib.name} ({lib.type})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions form-full">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} id="save-book-btn">
                  {editing ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default BookManagement;
