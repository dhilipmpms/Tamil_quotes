import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import { User, BookOpen, Quote, Feather, Award } from 'lucide-react';
import SEO from '../components/SEO';

const Authors = () => {
  const { language } = useApp();
  const [authors, setAuthors] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorWorks, setAuthorWorks] = useState({ quotes: [], kavithai: [], articles: [], stories: [] });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      // Get all profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      // Get counts of approved content by author name or user ID
      const [qData, kData, aData, sData] = await Promise.all([
        supabase.from('quotes').select('*').eq('status', 'approved'),
        supabase.from('kavithai').select('*').eq('status', 'approved'),
        supabase.from('philosophy_articles').select('*').eq('status', 'approved'),
        supabase.from('stories').select('*').eq('status', 'approved')
      ]);

      const authorList = [];

      // Map profiles first
      if (profiles) {
        profiles.forEach(profile => {
          // Find works associated with this user
          // Matching by username or guest author name matching
          const pq = (qData.data || []).filter(q => q.author.toLowerCase() === profile.username.toLowerCase());
          const pk = (kData.data || []).filter(k => k.author.toLowerCase() === profile.username.toLowerCase());
          const pa = (aData.data || []).filter(a => a.author.toLowerCase() === profile.username.toLowerCase());
          const ps = (sData.data || []).filter(s => s.author.toLowerCase() === profile.username.toLowerCase());
          
          const totalWorks = pq.length + pk.length + pa.length + ps.length;

          authorList.push({
            id: profile.id,
            name: profile.username,
            avatar: profile.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`,
            bio: profile.bio || 'Community writer and reader.',
            role: profile.role,
            totalWorks,
            works: { quotes: pq, kavithai: pk, articles: pa, stories: ps }
          });
        });
      }

      // Add other unique seed/guest authors from database who don't have registered profile rows
      const allContentAuthors = new Set();
      if (qData.data) qData.data.forEach(q => allContentAuthors.add(q.author));
      if (kData.data) kData.data.forEach(k => allContentAuthors.add(k.author));
      if (aData.data) aData.data.forEach(a => allContentAuthors.add(a.author));
      if (sData.data) sData.data.forEach(s => allContentAuthors.add(s.author));

      allContentAuthors.forEach(authorName => {
        // If they don't match a profile username
        const hasProfile = authorList.some(a => a.name.toLowerCase() === authorName.toLowerCase());
        if (!hasProfile) {
          const pq = (qData.data || []).filter(q => q.author.toLowerCase() === authorName.toLowerCase());
          const pk = (kData.data || []).filter(k => k.author.toLowerCase() === authorName.toLowerCase());
          const pa = (aData.data || []).filter(a => a.author.toLowerCase() === authorName.toLowerCase());
          const ps = (sData.data || []).filter(s => s.author.toLowerCase() === authorName.toLowerCase());
          const totalWorks = pq.length + pk.length + pa.length + ps.length;

          if (totalWorks > 0) {
            authorList.push({
              id: authorName,
              name: authorName,
              avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`,
              bio: 'Classical author / Historical scholar.',
              role: 'guest',
              totalWorks,
              works: { quotes: pq, kavithai: pk, articles: pa, stories: ps }
            });
          }
        }
      });

      // Sort authors by total works published descending
      authorList.sort((a, b) => b.totalWorks - a.totalWorks);
      setAuthors(authorList);
      
      // Auto-select first author
      if (authorList.length > 0) {
        setSelectedAuthor(authorList[0]);
        setAuthorWorks(authorList[0].works);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAuthor = (author) => {
    setSelectedAuthor(author);
    setAuthorWorks(author.works);
  };

  return (
    <div>
      <SEO title="Authors" description="Explore profiles of famous Tamil poets, classical writers, philosophers, and community contributors." />
      
      <div className="container" style={{ paddingTop: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem', textAlign: 'center' }}>
          {language === 'ta' ? 'எழுத்தாளர்கள் & கவிஞர்கள்' : 'Writers & Poets'}
        </h1>

        <div className="dashboard-layout">
          {/* Sidebar: Authors list */}
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {language === 'ta' ? 'எழுத்தாளர்கள் பட்டியல்' : 'Author List'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              {authors.map(author => (
                <div 
                  key={author.id}
                  className={`sidebar-item ${selectedAuthor && selectedAuthor.id === author.id ? 'active' : ''}`}
                  onClick={() => handleSelectAuthor(author)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem' }}
                >
                  <img 
                    src={author.avatar} 
                    alt={author.name} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {author.name}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {author.totalWorks} {author.totalWorks === 1 ? 'work' : 'works'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content: Author Details & Published Work Accordion */}
          {selectedAuthor ? (
            <div>
              {/* Author profile card */}
              <div className="author-profile-header">
                <img src={selectedAuthor.avatar} alt={selectedAuthor.name} className="author-large-avatar" />
                <div className="author-profile-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selectedAuthor.name}</h1>
                    {selectedAuthor.role === 'admin' && (
                      <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--accent-glow)',
                        color: 'var(--accent-secondary)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        Editor
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem', fontSize: '1rem' }}>
                    {selectedAuthor.bio}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Award size={16} /> Total Publications: <strong>{selectedAuthor.totalWorks}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* List Published Works by Category */}
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                {language === 'ta' ? 'வெளியிடப்பட்ட படைப்புகள்' : 'Published Works'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Kavithai (Poetry) */}
                {authorWorks.kavithai.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Feather size={16} /> Kavithai ({authorWorks.kavithai.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {authorWorks.kavithai.map(k => (
                        <div key={k.id} className="card" style={{ padding: '1.25rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{k.title}</h4>
                          <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-line',
                            fontStyle: 'italic',
                            maxHeight: '80px',
                            overflow: 'hidden',
                            marginTop: '0.5rem'
                          }}>{k.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotes */}
                {authorWorks.quotes.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Quote size={16} /> Quotes ({authorWorks.quotes.length})
                    </h3>
                    <div className="grid grid-cols-2">
                      {authorWorks.quotes.map(q => (
                        <div key={q.id} className="card quote-card" style={{ padding: '1.25rem' }}>
                          <p style={{ fontSize: '0.95rem', fontStyle: 'italic' }}>“{q.content}”</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Philosophy Articles */}
                {authorWorks.articles.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <BookOpen size={16} /> Philosophy Articles ({authorWorks.articles.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {authorWorks.articles.map(a => (
                        <div key={a.id} className="card" style={{ padding: '1.25rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{a.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {a.content.replace(/[#*`>]/g, '').substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stories */}
                {authorWorks.stories.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <BookOpen size={16} /> Stories ({authorWorks.stories.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {authorWorks.stories.map(s => (
                        <div key={s.id} className="card" style={{ padding: '1.25rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{s.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {s.content.replace(/[#*`>]/g, '').substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              Loading author profiles...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authors;
