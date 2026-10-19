import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Login             from './pages/Login';
import Signup            from './pages/Signup';
import Dashboard         from './pages/Dashboard';
import Companies         from './pages/Companies';
import Experiences       from './pages/Experiences';
import ExperienceDetails from './pages/ExperienceDetails';
import Preparation       from './pages/Preparation';
import EmotionalSupport  from './pages/EmotionalSupport';
import StudentStories    from './pages/StudentStories';
import StudentStoryDetails from './pages/StudentStoryDetails';
import ProtectedRoute    from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected routes — require a valid Supabase session */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/companies" element={
          <ProtectedRoute><Companies /></ProtectedRoute>
        } />
        <Route path="/companies/:companyId" element={
          <ProtectedRoute><Experiences /></ProtectedRoute>
        } />
        <Route path="/experiences/:experienceId" element={
          <ProtectedRoute><ExperienceDetails /></ProtectedRoute>
        } />
        <Route path="/preparation" element={
          <ProtectedRoute><Preparation /></ProtectedRoute>
        } />
        <Route path="/talk" element={
          <ProtectedRoute><EmotionalSupport /></ProtectedRoute>
        } />
        <Route path="/student-stories" element={
          <ProtectedRoute><StudentStories /></ProtectedRoute>
        } />
        <Route path="/student-stories/:storyId" element={
          <ProtectedRoute><StudentStoryDetails /></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
