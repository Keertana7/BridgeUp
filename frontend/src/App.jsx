import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import ExperienceDetailPage from './pages/ExperienceDetailPage';
import QuestionsPage from './pages/QuestionsPage';
import AdvicePage from './pages/AdvicePage';
import ResourcesPage from './pages/ResourcesPage';
import ChatPage from './pages/ChatPage';
import AskGeneratePage from './pages/AskGeneratePage';
import EmotionalSupport from './pages/EmotionalSupport';
import UploadPage from './pages/UploadPage';

import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-root">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes — require authentication */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute>
                    <CompaniesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:companyId"
                element={
                  <ProtectedRoute>
                    <CompanyDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/experiences/:experienceId"
                element={
                  <ProtectedRoute>
                    <ExperienceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questions"
                element={
                  <ProtectedRoute>
                    <QuestionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ask-generate"
                element={
                  <ProtectedRoute>
                    <AskGeneratePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advice"
                element={
                  <ProtectedRoute>
                    <AdvicePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute>
                    <ResourcesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talk"
                element={
                  <ProtectedRoute>
                    <EmotionalSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
      <p style={{ fontSize: '3rem' }}>🔍</p>
      <h1 style={{ fontWeight: 700, color: '#111827' }}>Page not found</h1>
      <p style={{ color: '#6b7280' }}>
        The page you&apos;re looking for doesn&apos;t exist.{' '}
        <a href="/" style={{ color: '#4f46e5' }}>Go home</a>
      </p>
    </div>
  );
}
