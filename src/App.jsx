import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages lazy/direct imports
import Home from './pages/Home';
import Quotes from './pages/Quotes';
import Kavithai from './pages/Kavithai';
import Philosophy from './pages/Philosophy';
import Stories from './pages/Stories';
import Authors from './pages/Authors';
import Categories from './pages/Categories';
import Search from './pages/Search';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Lucide icons for mobile bottom nav
import { Home as HomeIcon, MessageSquare, Feather, Compass, BookOpen, User, X } from 'lucide-react';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="notification-container">
      {notifications.map((n) => (
        <div key={n.id} className={`toast toast-${n.type}`}>
          <span>{n.message}</span>
          <button 
            onClick={() => removeNotification(n.id)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const MobileStickyNav = () => {
  const location = useLocation();
  const { t } = useApp();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="mobile-nav">
      <Link to="/" className={`mobile-nav-item ${isActive('/')}`}>
        <HomeIcon size={20} />
        <span>Home</span>
      </Link>
      <Link to="/quotes" className={`mobile-nav-item ${isActive('/quotes')}`}>
        <MessageSquare size={20} />
        <span>Quotes</span>
      </Link>
      <Link to="/kavithai" className={`mobile-nav-item ${isActive('/kavithai')}`}>
        <Feather size={20} />
        <span>Kavithai</span>
      </Link>
      <Link to="/philosophy" className={`mobile-nav-item ${isActive('/philosophy')}`}>
        <Compass size={20} />
        <span>Philosophy</span>
      </Link>
      <Link to="/stories" className={`mobile-nav-item ${isActive('/stories')}`}>
        <BookOpen size={20} />
        <span>Stories</span>
      </Link>
      <Link to="/profile" className={`mobile-nav-item ${isActive('/profile')}`}>
        <User size={20} />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

// Route security guard for Admin access
const AdminRoute = ({ children }) => {
  const { profile, loading } = useApp();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>Loading...</div>;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route security guard for Authenticated users
const PrivateRoute = ({ children }) => {
  const { user, loading } = useApp();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/kavithai" element={<Kavithai />} />
          <Route path="/philosophy" element={<Philosophy />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MobileStickyNav />
      <NotificationContainer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
