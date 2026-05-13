import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';

// Student pages
import StudentDashboard from './components/Student/StudentDashboard';
import ViewMarks from './components/Student/ViewMarks';
import BookRecommendations from './components/Student/BookRecommendations';
import LibraryFinder from './components/Map/LibraryFinder';

// Admin pages
import AdminDashboard from './components/Admin/Dashboard';
import StudentManagement from './components/Admin/StudentManagement';
import MarksManagement from './components/Admin/MarksManagement';
import BookManagement from './components/Admin/BookManagement';
import LibraryManagement from './components/Admin/LibraryManagement';
import AnalyticsDashboard from './components/Admin/AnalyticsDashboard';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/marks" element={
            <ProtectedRoute role="student"><ViewMarks /></ProtectedRoute>
          } />
          <Route path="/student/recommendations" element={
            <ProtectedRoute role="student"><BookRecommendations /></ProtectedRoute>
          } />
          <Route path="/student/library" element={
            <ProtectedRoute role="student"><LibraryFinder /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute role="admin"><StudentManagement /></ProtectedRoute>
          } />
          <Route path="/admin/marks" element={
            <ProtectedRoute role="admin"><MarksManagement /></ProtectedRoute>
          } />
          <Route path="/admin/books" element={
            <ProtectedRoute role="admin"><BookManagement /></ProtectedRoute>
          } />
          <Route path="/admin/libraries" element={
            <ProtectedRoute role="admin"><LibraryManagement /></ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute role="admin"><AnalyticsDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
