import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Search, Heart, Bookmark, Share2, Eye, Filter } from 'lucide-react';
import SEO from '../components/SEO';

const Quotes = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, addNotification, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [activeLanguage, setActiveLanguage] = useState('all'); // 'all', 'ta', 'en'

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [activeCategory, activeLanguage, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', 'quotes');
    if (data) setCategories(data);
  };

  const fetchQuotes = async () => {
    try {
      let query = supabase.from('quotes').select('*').eq('status', 'approved');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      if (activeLanguage !== 'all') {
        query = query.eq('language', activeLanguage);
      }

      const { data } = await query;
      if (data) {
        // Local keyword search filter
        let filtered = data;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = data.filter(item => 
            (item.content && item.content.toLowerCase().includes(q)) ||
            (item.author && item.author.toLowerCase().includes(q)) ||
            (item.title && item.title.toLowerCase().includes(q))
          );
        }
        setQuotes(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const incrementViews = async (id, currentViews) => {
    try {
      await supabase.from('quotes').update({ views: (currentViews || 0) + 1 }).eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (quote) => {
    incrementViews(quote.id, quote.views);
    const text = `"${quote.content}"\n\n- ${quote.author}\nRead more at Tamil Literature Platform.`;
    navigator.clipboard.writeText(text);
    addNotification(language === 'ta' ? 'பகிர்வு இணைப்பு நகலெடுக்கப்பட்டது!' : 'Share text copied to clipboard!', 'success');
    
    // Optimistic UI views increment
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, views: (q.views || 0) + 1 } : q));
  };

  const handleCategoryClick = (categorySlug) => {
    setActiveCategory(categorySlug);
    if (categorySlug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categorySlug);
    }
    setSearchParams(searchParams);
  };

  const isLiked = (id) => userLikes.some(l => l.content_type === 'quotes' && l.content_id === id);
  const isBookmarked = (id) => userBookmarks.some(b => b.content_type === 'quotes' && b.content_id === id);

  return (
    <div>
      <SEO 
        title="Quotes" 
        description="Browse and share motivational, life, love, friendship, success, and spiritual quotes in Tamil and English." 
      />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
          {language === 'ta' ? 'மேற்கோள்களைக் கண்டறிக' : 'Browse Quotes'}
        </h1>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <Search className="search-icon-svg" size={18} />
            <input
              type="text"
              placeholder={language === 'ta' ? 'மேற்கோள் அல்லது ஆசிரியர் பெயரைத் தேடுக...' : 'Search by quote or author...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ padding: '0.75rem 1.5rem 0.75rem 3rem' }}
            />
          </div>

          {/* Language and category selectors */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={activeLanguage}
                onChange={(e) => setActiveLanguage(e.target.value)}
                className="form-control"
                style={{ width: '130px', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
              >
                <option value="all">All Languages</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('all')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`tab-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quotes Display Grid */}
        {quotes.length > 0 ? (
          <div className="grid grid-cols-2">
            {quotes.map((quote) => (
              <div key={quote.id} className="card quote-card">
                <span className="card-tag">{quote.category}</span>
                <p className="quote-content" style={{ fontSize: '1.25rem' }}>“{quote.content}”</p>
                <p className="quote-author" style={{ fontSize: '0.95rem' }}>— {quote.author}</p>
                
                <div className="card-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0' }}>
                  <div className="action-icons">
                    <button 
                      className={`action-icon ${isLiked(quote.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike('quotes', quote.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Heart size={18} fill={isLiked(quote.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className={`action-icon ${isBookmarked(quote.id) ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark('quotes', quote.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Bookmark size={18} fill={isBookmarked(quote.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className="action-icon"
                      onClick={() => handleShare(quote)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Eye size={14} /> {quote.views || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>No quotes found matching the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotes;
