import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { MyJobs } from './pages/MyJobs';
import { Platforms } from './pages/Platforms';

function App() {
  const { isAuthenticated, initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/marketplace"
          element={
            isAuthenticated ? <Marketplace /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/my-jobs"
          element={
            isAuthenticated ? <MyJobs /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/platforms"
          element={
            isAuthenticated ? <Platforms /> : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
