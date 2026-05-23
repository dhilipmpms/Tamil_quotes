import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Heart, Bookmark, Share2, Eye, Compass, Clock, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import CommentSystem from '../components/CommentSystem';
import { parseMarkdown } from '../components/RichTextEditor';

const Philosophy = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, addNotification, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Reading Viewer Modal State
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', 'philosophy');
    if (data) setCategories(data);
  };

  const fetchArticles = async () => {
    try {
      let query = supabase.from('philosophy_articles').select('*').eq('status', 'approved');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      if (data) setArticles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArticle = async (article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
    
    // Increment view count in DB
    try {
      await supabase.from('philosophy_articles').update({ views: (article.views || 0) + 1 }).eq('id', article.id);
      // Update local state views count
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a));
      setSelectedArticle(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (article, e) => {
    if (e) e.stopPropagation();
    const text = `"${article.title}" by ${article.author}\nRead this philosophy article on Tamil Literature Platform.`;
    navigator.clipboard.writeText(text);
    addNotification(language === 'ta' ? 'கட்டுரை இணைப்பு நகலெடுக்கப்பட்டது!' : 'Article link copied to clipboard!', 'success');
  };

  const isLiked = (id) => userLikes.some(l => l.content_type === 'philosophy' && l.content_id === id);
  const isBookmarked = (id) => userBookmarks.some(b => b.content_type === 'philosophy' && b.content_id === id);

  return (
    <div>
      <SEO 
        title="Philosophy & Life Lessons" 
        description="Read articles on Stoicism, Tamil Wisdom, Thirukkural ethics, and personal growth for a balanced life." 
      />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Compass size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {language === 'ta' ? 'தத்துவச் சிந்தனைகள்' : 'Philosophy & Life Lessons'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {language === 'ta' ? 'வாழ்வியல் வழிகாட்டி, தத்துவங்கள், மற்றும் அறிஞர்களின் சிந்தனைகள்' : 'Timeless wisdom, ancient ethics, and practical philosophy for life.'}
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
            All Articles
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

        {/* Articles Listing */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-2">
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="card"
                onClick={() => handleOpenArticle(article)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}
              >
                <div>
                  <span className="card-tag">{article.category}</span>
                  <h3 className="card-title" style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>{article.title}</h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    {article.content.replace(/[#*`>]/g, '')}
                  </p>
                </div>

                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                    <Clock size={12} />
                    {article.reading_time || 5} min read
                  </span>
                  
                  <div className="action-icons">
                    <button 
                      className={`action-icon ${isLiked(article.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike('philosophy', article.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Heart size={16} fill={isLiked(article.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className={`action-icon ${isBookmarked(article.id) ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark('philosophy', article.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Bookmark size={16} fill={isBookmarked(article.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="action-icon"
                      onClick={(e) => handleShare(article, e)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Share2 size={16} />
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Eye size={12} /> {article.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No articles found in this category.</p>
          </div>
        )}

        {/* Detailed Article Reading Modal */}
        {selectedArticle && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={selectedArticle.title}
          >
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                <span>By <strong style={{ color: 'var(--text-primary)' }}>{selectedArticle.author}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> {selectedArticle.reading_time || 5} min read
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Eye size={14} /> {selectedArticle.views} views
                  </span>
                </span>
              </div>

              {/* Render parsed markdown text */}
              <div 
                className="reading-body"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  margin: '2rem 0'
                }}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedArticle.content) }}
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
                  className={`btn btn-secondary ${isLiked(selectedArticle.id) ? 'liked' : ''}`}
                  onClick={() => toggleLike('philosophy', selectedArticle.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isLiked(selectedArticle.id) ? 'var(--error)' : 'inherit' }}
                >
                  <Heart size={16} fill={isLiked(selectedArticle.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'விருப்பம்' : 'Like'}
                </button>
                <button 
                  className={`btn btn-secondary ${isBookmarked(selectedArticle.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark('philosophy', selectedArticle.id)}
                  style={{ display: 'inline-flex', gap: '0.5rem', color: isBookmarked(selectedArticle.id) ? 'var(--warning)' : 'inherit' }}
                >
                  <Bookmark size={16} fill={isBookmarked(selectedArticle.id) ? 'currentColor' : 'none'} />
                  {language === 'ta' ? 'சேமி' : 'Bookmark'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleShare(selectedArticle)}
                  style={{ display: 'inline-flex', gap: '0.5rem' }}
                >
                  <Share2 size={16} />
                  {language === 'ta' ? 'பகிர்' : 'Copy'}
                </button>
              </div>

              {/* Comments Thread */}
              <CommentSystem contentType="philosophy" contentId={selectedArticle.id} />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Philosophy;
