import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Heart, Bookmark, Share2, Eye, BookOpen, Clock, ZoomIn, ZoomOut, Type } from 'lucide-react';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import CommentSystem from '../components/CommentSystem';
import { parseMarkdown } from '../components/RichTextEditor';

const Stories = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, addNotification, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Reading Mode State
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textSize, setTextSize] = useState('medium'); // 'small', 'medium', 'large'
  const [fontSerif, setFontSerif] = useState(true); // true = Serif, false = Sans

  // Filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchStories();
  }, [activeCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', 'stories');
    if (data) setCategories(data);
  };

  const fetchStories = async () => {
    try {
      let query = supabase.from('stories').select('*').eq('status', 'approved');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      if (data) setStories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenStory = async (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
    
    // Increment view count in DB
    try {
      await supabase.from('stories').update({ views: (story.views || 0) + 1 }).eq('id', story.id);
      // Update local state views count
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, views: (s.views || 0) + 1 } : s));
      setSelectedStory(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (story, e) => {
    if (e) e.stopPropagation();
    const text = `Read "${story.title}" on Tamil Literature Platform.`;
    navigator.clipboard.writeText(text);
    addNotification(language === 'ta' ? 'கதை இணைப்பு நகலெடுக்கப்பட்டது!' : 'Story link copied to clipboard!', 'success');
  };

  const isLiked = (id) => userLikes.some(l => l.content_type === 'stories' && l.content_id === id);
  const isBookmarked = (id) => userBookmarks.some(b => b.content_type === 'stories' && b.content_id === id);

  const getFontSizeStyle = () => {
    if (textSize === 'small') return '0.95rem';
    if (textSize === 'large') return '1.35rem';
    return '1.15rem'; // medium
  };

  return (
    <div>
      <SEO 
        title="Short Stories" 
        description="Read inspirational short stories, cultural tales, and real-life lessons in Tamil and English." 
      />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <BookOpen size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {language === 'ta' ? 'சிறுகதைக் கதம்பம்' : 'Short Stories'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {language === 'ta' ? 'மனதை ஊக்குவிக்கும் கதைகள் மற்றும் வாழ்க்கைப் பதிவுகள்' : 'Inspirational short stories and reflective narratives.'}
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
            All Stories
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

        {/* Stories Listing */}
        {stories.length > 0 ? (
          <div className="grid grid-cols-2">
            {stories.map((story) => (
              <div 
                key={story.id} 
                className="card"
                onClick={() => handleOpenStory(story)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <span className="card-tag">{story.category}</span>
                  <h3 className="card-title" style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>{story.title}</h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    {story.content.replace(/[#*`>]/g, '')}
                  </p>
                </div>

                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                    <Clock size={12} />
                    {story.reading_time || 5} min read
                  </span>
                  
                  <div className="action-icons">
                    <button 
                      className={`action-icon ${isLiked(story.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike('stories', story.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Heart size={16} fill={isLiked(story.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className={`action-icon ${isBookmarked(story.id) ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark('stories', story.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Bookmark size={16} fill={isBookmarked(story.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="action-icon"
                      onClick={(e) => handleShare(story, e)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Share2 size={16} />
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Eye size={12} /> {story.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No stories found. Submit your first story today!</p>
          </div>
        )}

        {/* Immersive Reading Modal */}
        {selectedStory && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={selectedStory.title}
          >
            <div style={{ padding: '0.5rem 0' }}>
              
              {/* Text Formatting Controls Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>SIZE:</span>
                  <button 
                    onClick={() => setTextSize('small')} 
                    className={`tab-btn ${textSize === 'small' ? 'active' : ''}`}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setTextSize('medium')} 
                    className={`tab-btn ${textSize === 'medium' ? 'active' : ''}`}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setTextSize('large')} 
                    className={`tab-btn ${textSize === 'large' ? 'active' : ''}`}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    A+
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>FONT:</span>
                  <button 
                    onClick={() => setFontSerif(!fontSerif)}
                    className="tab-btn"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Type size={12} /> {fontSerif ? 'Serif' : 'Sans'}
                  </button>
                </div>
              </div>

              {/* Meta information */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                <span>Written by <strong style={{ color: 'var(--text-primary)' }}>{selectedStory.author}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> {selectedStory.reading_time || 5} min read
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Eye size={14} /> {selectedStory.views} views
                  </span>
                </span>
              </div>

              {/* Story Body Text */}
              <div 
                className="reading-body"
                style={{
                  fontSize: getFontSizeStyle(),
                  fontFamily: fontSerif ? 'Mukta Malar, Georgia, serif' : 'Outfit, sans-serif',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '2rem 1.5rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.9',
                  color: 'var(--text-primary)',
                  margin: '2rem 0'
                }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedStory.content) }}
              />

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                margin: '1.5rem 0 2rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1.5rem'
              }}>
                <button 
                  className={`btn btn-secondary ${isLiked(selectedStory.id) ? 'liked' : ''}`}
                  onClick={() => toggleLike('stories', selectedStory.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isLiked(selectedStory.id) ? 'var(--error)' : 'inherit' }}
                >
                  <Heart size={16} fill={isLiked(selectedStory.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'விருப்பம்' : 'Like'}
                </button>
                <button 
                  className={`btn btn-secondary ${isBookmarked(selectedStory.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark('stories', selectedStory.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isBookmarked(selectedStory.id) ? 'var(--warning)' : 'inherit' }}
                >
                  <Bookmark size={16} fill={isBookmarked(selectedStory.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'சேமி' : 'Bookmark'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleShare(selectedStory)}
                  style={{ display: 'inline-flex', gap: '0.5rem' }}
                >
                  <Share2 size={16} />
                  {language === 'ta' ? 'பகிர்' : 'Copy'}
                </button>
              </div>

              {/* Comments */}
              <CommentSystem contentType="stories" contentId={selectedStory.id} />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Stories;
