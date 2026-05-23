import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Footer = () => {
  const { language, t } = useApp();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: '4rem 0 6rem', // extra bottom padding for mobile bottom bar
      color: 'var(--text-secondary)',
      fontSize: '0.9rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Platform Summary */}
          <div>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
              fontWeight: 700
            }}>{t('siteTitle')}</h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
              {language === 'ta'
                ? 'தமிழ் இலக்கியம், கவிதைகள், மற்றும் தத்துவங்களை உலகெங்கும் கொண்டு சேர்க்கும் ஒரு சமூக தளம்.'
                : 'A community platform to share and discover Tamil and English literature, poetry, philosophy, and stories worldwide.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600 }}>{language === 'ta' ? 'விரைவு இணைப்புகள்' : 'Quick Links'}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/quotes')}>{t('quotes')}</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/kavithai')}>{t('kavithai')}</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/philosophy')}>{t('philosophy')}</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/stories')}>{t('stories')}</span>
              </li>
            </ul>
          </div>

          {/* Categories Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 600 }}>{language === 'ta' ? 'பிரபலமான பிரிவுகள்' : 'Popular Categories'}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/quotes?category=motivation')}>Motivation</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/quotes?category=wisdom')}>Wisdom</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/philosophy?category=stoicism')}>Stoicism</span>
              </li>
              <li>
                <span className="hover-link cursor-pointer" onClick={() => navigate('/philosophy?category=tamil-wisdom')}>Tamil Wisdom</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <p>© {currentYear} {t('siteTitle')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
