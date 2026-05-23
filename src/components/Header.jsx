import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Languages, User, LogOut, Shield, LogIn, Plus } from 'lucide-react';

const Header = () => {
  const { theme, toggleTheme, language, toggleLanguage, user, profile, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabaseClient');
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <div className="logo" onClick={() => navigate('/')}>
            <span>{t('siteTitle')}</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="nav-links">
            <span className={`nav-link cursor-pointer ${isActive('/quotes')}`} onClick={() => navigate('/quotes')}>
              {t('quotes')}
            </span>
            <span className={`nav-link cursor-pointer ${isActive('/kavithai')}`} onClick={() => navigate('/kavithai')}>
              {t('kavithai')}
            </span>
            <span className={`nav-link cursor-pointer ${isActive('/philosophy')}`} onClick={() => navigate('/philosophy')}>
              {t('philosophy')}
            </span>
            <span className={`nav-link cursor-pointer ${isActive('/stories')}`} onClick={() => navigate('/stories')}>
              {t('stories')}
            </span>
            <span className={`nav-link cursor-pointer ${isActive('/authors')}`} onClick={() => navigate('/authors')}>
              {t('authors')}
            </span>
            <span className={`nav-link cursor-pointer ${isActive('/categories')}`} onClick={() => navigate('/categories')}>
              {t('categories')}
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="nav-actions">
            {/* Language Switcher */}
            <button className="icon-btn" onClick={toggleLanguage} title={language === 'ta' ? 'English' : 'தமிழ்'}>
              <Languages size={18} />
            </button>

            {/* Theme Switcher */}
            <button className="icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Auth / Profile Actions */}
            {profile ? (
              <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {profile.role === 'admin' && (
                  <button 
                    className="icon-btn" 
                    onClick={() => navigate('/admin')} 
                    title={t('adminDashboard')}
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                  >
                    <Shield size={18} />
                  </button>
                )}
                
                <button 
                  className="icon-btn" 
                  onClick={() => navigate('/profile')} 
                  title={t('profile')}
                >
                  <User size={18} />
                </button>

                <button 
                  className="icon-btn" 
                  onClick={handleLogout} 
                  title={t('logout')}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/login')}
                style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
              >
                <LogIn size={16} />
                <span className="hidden md:inline">{t('login')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
