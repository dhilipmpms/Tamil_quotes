import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Heart, Bookmark, Share2, Eye, Feather, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import CommentSystem from '../components/CommentSystem';

const Kavithai = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, addNotification, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [poems, setPoems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Modal viewer state
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPoems();
  }, [activeCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', 'kavithai');
    if (data) setCategories(data);
  };

  const fetchPoems = async () => {
    try {
      let query = supabase.from('kavithai').select('*').eq('status', 'approved');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      if (data) setPoems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPoem = async (poem) => {
    setSelectedPoem(poem);
    setIsModalOpen(true);
    
    // Increment view count in DB
    try {
      await supabase.from('kavithai').update({ views: (poem.views || 0) + 1 }).eq('id', poem.id);
      // Update local state views count
      setPoems(prev => prev.map(p => p.id === poem.id ? { ...p, views: (p.views || 0) + 1 } : p));
      setSelectedPoem(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (poem, e) => {
    if (e) e.stopPropagation();
    const text = `"${poem.title}"\n\n${poem.content}\n\n- ${poem.author}\nRead poetry on Tamil Literature Platform.`;
    navigator.clipboard.writeText(text);
    addNotification(language === 'ta' ? 'கவிதை நகலெடுக்கப்பட்டது!' : 'Poem copied to clipboard!', 'success');
  };

  const isLiked = (id) => userLikes.some(l => l.content_type === 'kavithai' && l.content_id === id);
  const isBookmarked = (id) => userBookmarks.some(b => b.content_type === 'kavithai' && b.content_id === id);

  return (
    <div>
      <SEO 
        title="Kavithai (Tamil Poetry)" 
        description="Read classical and modern Tamil poetry and verses written by famous poets and community writers." 
      />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Feather size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {language === 'ta' ? 'கவிதைச் சோலை' : 'Kavithai (Tamil Poetry)'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {language === 'ta' ? 'மரபுக் கவிதைகள் மற்றும் புதுக்கவிதைகளின் தொகுப்பு' : 'A collection of classical and contemporary Tamil verses.'}
          </p>
        </div>

        {/* Categories filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          <button 
            className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveCategory('all'); searchParams.delete('category'); setSearchParams(searchParams); }}
          >
            All Poetry
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat.slug); searchParams.set('category', cat.slug); setSearchParams(searchParams); }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Poetry Listing */}
        {poems.length > 0 ? (
          <div className="grid grid-cols-2">
            {poems.map((poem) => (
              <div 
                key={poem.id} 
                className="card"
                onClick={() => handleOpenPoem(poem)}
                style={{ cursor: 'pointer', padding: '2rem' }}
              >
                <div>
                  <span className="card-tag">{poem.category}</span>
                  <h3 className="card-title" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>{poem.title}</h3>
                  <p style={{
                    whiteSpace: 'pre-line',
                    fontStyle: 'italic',
                    lineHeight: '1.8',
                    color: 'var(--text-secondary)',
                    maxHeight: '150px',
                    overflow: 'hidden',
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    marginBottom: '1.5rem'
                  }}>
                    {poem.content}
                  </p>
                </div>

                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>
                    — {poem.author}
                  </span>
                  
                  <div className="action-icons">
                    <button 
                      className={`action-icon ${isLiked(poem.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike('kavithai', poem.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Heart size={16} fill={isLiked(poem.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className={`action-icon ${isBookmarked(poem.id) ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark('kavithai', poem.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Bookmark size={16} fill={isBookmarked(poem.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="action-icon"
                      onClick={(e) => handleShare(poem, e)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Share2 size={16} />
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Eye size={12} /> {poem.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No poems found. Check back later!</p>
          </div>
        )}

        {/* Detailed Poem Reading Modal */}
        {selectedPoem && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={selectedPoem.title}
          >
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {language === 'ta' ? 'எழுதியவர்' : 'Author'}: {selectedPoem.author}
                </span>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                  <Eye size={14} /> {selectedPoem.views} views
                </span>
              </div>

              {/* Poem Content */}
              <div style={{
                whiteSpace: 'pre-line',
                fontStyle: 'italic',
                lineHeight: '2',
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                textAlign: 'center',
                margin: '2rem 0',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '16px'
              }}>
                {selectedPoem.content}
              </div>

              {/* Interaction icons inside modal */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                margin: '1.5rem 0 2rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1.5rem'
              }}>
                <button 
                  className={`btn btn-secondary ${isLiked(selectedPoem.id) ? 'liked' : ''}`}
                  onClick={() => toggleLike('kavithai', selectedPoem.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isLiked(selectedPoem.id) ? 'var(--error)' : 'inherit' }}
                >
                  <Heart size={16} fill={isLiked(selectedPoem.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'விருப்பம்' : 'Like'}
                </button>
                <button 
                  className={`btn btn-secondary ${isBookmarked(selectedPoem.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark('kavithai', selectedPoem.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isBookmarked(selectedPoem.id) ? 'var(--warning)' : 'inherit' }}
                >
                  <Bookmark size={16} fill={isBookmarked(selectedPoem.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'சேமி' : 'Bookmark'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleShare(selectedPoem)}
                  style={{ display: 'inline-flex', gap: '0.5rem' }}
                >
                  <Share2 size={16} />
                  {language === 'ta' ? 'பகிர்' : 'Copy'}
                </button>
              </div>

              {/* Nested comments component */}
              <CommentSystem contentType="kavithai" contentId={selectedPoem.id} />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Kavithai;
