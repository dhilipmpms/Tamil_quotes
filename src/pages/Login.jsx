import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, User, BookOpen, UserCheck } from 'lucide-react';
import SEO from '../components/SEO';

const Login = () => {
  const { user, profile, language, addNotification, fetchProfile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegisterPage = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterPage);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  useEffect(() => {
    if (user && profile) {
      navigate('/profile');
    }
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addNotification(language === 'ta' ? 'அனைத்து புலங்களையும் நிரப்பவும்.' : 'Please fill all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // Register Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              bio,
              role: email.toLowerCase().includes('admin') ? 'admin' : 'user'
            }
          }
        });

        if (error) throw error;
        
        addNotification(language === 'ta' ? 'பதிவு வெற்றிகரமாக முடிந்தது! உள்நுழையப்பட்டது.' : 'Registration successful! Logged in.', 'success');
      } else {
        // Login Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        addNotification(language === 'ta' ? 'வெற்றிகரமாக உள்நுழைந்தீர்கள்.' : 'Logged in successfully.', 'success');
      }
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SEO title={isRegister ? 'Sign Up' : 'Log In'} />

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        paddingTop: '3rem'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem',
          boxShadow: 'var(--card-shadow)'
        }}>
          {/* Header tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => { setIsRegister(false); navigate('/login'); }}
              style={{
                flexGrow: 1,
                background: 'transparent',
                border: 'none',
                color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                borderBottom: !isRegister ? '2px solid var(--accent-primary)' : 'none',
                paddingBottom: '0.5rem',
                marginBottom: '-17px'
              }}
            >
              {language === 'ta' ? 'உள்நுழைவு' : 'Log In'}
            </button>
            <button
              onClick={() => { setIsRegister(true); navigate('/register'); }}
              style={{
                flexGrow: 1,
                background: 'transparent',
                border: 'none',
                color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                borderBottom: isRegister ? '2px solid var(--accent-primary)' : 'none',
                paddingBottom: '0.5rem',
                marginBottom: '-17px'
              }}
            >
              {language === 'ta' ? 'பதிவு செய்தல்' : 'Register'}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Username (Only for Register) */}
            {isRegister && (
              <div className="form-group">
                <label className="form-label">{language === 'ta' ? 'பயனர் பெயர்' : 'Username'}</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="bharathi_99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">{language === 'ta' ? 'மின்னஞ்சல்' : 'Email Address'}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
              {isRegister && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  * Tip: Use email containing "admin" to register as a mock admin user.
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">{language === 'ta' ? 'கடவுச்சொல்' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Bio (Only for Register) */}
            {isRegister && (
              <div className="form-group">
                <label className="form-label">{language === 'ta' ? 'சுயகுறிப்பு (விருப்பம்)' : 'Bio (Optional)'}</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    placeholder="Describe your literary interests..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '1rem', height: '48px' }}
            >
              {loading 
                ? 'Processing...' 
                : (isRegister 
                    ? (language === 'ta' ? 'கணக்கை உருவாக்கு' : 'Create Account') 
                    : (language === 'ta' ? 'உள்நுழைக' : 'Log In'))
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
