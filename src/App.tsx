import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalLayout from './components/layout/GlobalLayout';
import SignIn from './views/SignIn';
import Home from './views/Home';
import Analytics from './views/Analytics';
import Directory from './views/Directory';
import Profile from './views/Profile';
import PublicEmployeeProfile from './views/PublicEmployeeProfile';
import Admin from './views/Admin';

import React from 'react';
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/p/:id" element={<PublicEmployeeProfile />} />

          {/* Protected Routes wrapped in Global Layout */}
          <Route element={
            <ProtectedRoute>
              <GlobalLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
