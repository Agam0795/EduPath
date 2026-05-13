import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recommendationsAPI } from '../../services/api';
import { FiAlertCircle, FiBook, FiMapPin, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const COVER_COLORS = ['#2563EB', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#DC2626'];

const BookCard = ({ book, idx }) => {
  const color = COVER_COLORS[idx % COVER_COLORS.length];
  const libCount = book.availableAt?.length || 0;

  return (
    <div className="book-card" id={`book-card-${book._id}`}>
      <div className="book-cover" style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
        <FiBook size={36} color="white" />
        <div className="book-cover-title">{book.title.slice(0, 20)}{book.title.length > 20 ? '...' : ''}</div>
      </div>
      <div className="book-info">
        <div className="book-subject-tag" style={{ background: color + '20', color }}>
          {book.subjectCode}
        </div>
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <div className="book-rating">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} size={12} fill={i < Math.floor(book.rating || 4) ? '#F59E0B' : 'none'} stroke="#F59E0B" />
          ))}
          <span className="rating-val">{book.rating || 4.0}</span>
        </div>
        <p className="book-desc">{book.description?.slice(0, 100)}{book.description?.length > 100 ? '...' : ''}</p>
        {book.isbn && <p className="book-isbn">ISBN: {book.isbn}</p>}
        <div className="book-footer">
          <span className="lib-count">
            <FiMapPin size={12} />
            {libCount} {libCount === 1 ? 'library' : 'libraries'}
          </span>
          <Link to="/student/library" className="find-btn" id={`find-lib-btn-${book._id}`}>
            Find Library
          </Link>
        </div>
      </div>
    </div>
  );
};

const BookRecommendations = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await recommendationsAPI.getByStudent(user._id);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetch();
  }, [user]);

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Book Recommendations</h1>
            <p className="page-subtitle">Curated books for your weak subjects</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner-large"></div><p>Analyzing your performance...</p></div>
        ) : !data?.weakSubjects?.length ? (
          <div className="empty-state-card success-state">
            <div className="success-icon">🎉</div>
            <h3>Great Job!</h3>
            <p>You're performing well in all subjects. No recommendations needed!</p>
          </div>
        ) : (
          <>
            {/* Alert Banner */}
            <div className="alert-banner">
              <FiAlertCircle size={20} />
              <span>
                You have <strong>{data.weakSubjects.length} weak subject{data.weakSubjects.length > 1 ? 's' : ''}</strong> below threshold.
                Here are personalized book recommendations to help you improve.
              </span>
            </div>

            {/* Weak Subjects Summary */}
            <div className="weak-chips">
              {data.weakSubjects.map((ws, idx) => (
                <div key={idx} className="weak-chip">
                  <span className="chip-code">{ws.subjectCode}</span>
                  <span className="chip-name">{ws.subjectName}</span>
                  <span className="chip-score" style={{ color: '#DC2626' }}>{ws.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Recommendations Grouped by Subject */}
            {data.recommendations.map((group, gIdx) => (
              <div key={gIdx} className="rec-section">
                <div className="rec-header">
                  <div className="rec-subject-info">
                    <span className="rec-badge" style={{ background: '#DC262620', color: '#DC2626' }}>
                      <FiAlertCircle size={14} /> Weak Subject
                    </span>
                    <h2 className="rec-subject-name">{group.subject.subjectName}</h2>
                    <code className="rec-code">{group.subject.subjectCode}</code>
                  </div>
                  <div className="rec-score-display">
                    <div className="score-circle" style={{ borderColor: '#DC2626' }}>
                      <span className="score-val">{group.subject.percentage}%</span>
                      <span className="score-grade">{group.subject.grade}</span>
                    </div>
                  </div>
                </div>

                {group.books.length === 0 ? (
                  <div className="no-books">No books found for this subject. Check with admin to add books.</div>
                ) : (
                  <div className="books-grid">
                    {group.books.map((book, bIdx) => (
                      <BookCard key={book._id} book={book} idx={bIdx} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default BookRecommendations;
