import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { Search, Heart, Bookmark, Share2, BookOpen, Clock, ChevronRight, PenTool } from 'lucide-react';
import SEO from '../components/SEO';

const Home = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, addNotification, t } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Content states
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [featuredKavithai, setFeaturedKavithai] = useState(null);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [featuredStory, setFeaturedStory] = useState(null);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // 1. Quote of the Day (featured quotes)
      const quoteRes = await supabase.from('quotes').select('*').eq('featured', true).limit(1);
      if (quoteRes.data && quoteRes.data.length > 0) {
        setQuoteOfTheDay(quoteRes.data[0]);
      } else {
        // Fallback to latest approved quote
        const latestQuote = await supabase.from('quotes').select('*').limit(1);
        if (latestQuote.data) setQuoteOfTheDay(latestQuote.data[0]);
      }

      // 2. Featured Kavithai
      const kavithaiRes = await supabase.from('kavithai').select('*').eq('featured', true).limit(1);
      if (kavithaiRes.data && kavithaiRes.data.length > 0) {
        setFeaturedKavithai(kavithaiRes.data[0]);
      } else {
        const latestK = await supabase.from('kavithai').select('*').limit(1);
        if (latestK.data) setFeaturedKavithai(latestK.data[0]);
      }

      // 3. Featured Philosophy Article
      const articleRes = await supabase.from('philosophy_articles').select('*').eq('featured', true).limit(1);
      if (articleRes.data && articleRes.data.length > 0) {
        setFeaturedArticle(articleRes.data[0]);
      } else {
        const latestA = await supabase.from('philosophy_articles').select('*').limit(1);
        if (latestA.data) setFeaturedArticle(latestA.data[0]);
      }

      // 4. Featured Story
      const storyRes = await supabase.from('stories').select('*').eq('featured', true).limit(1);
      if (storyRes.data && storyRes.data.length > 0) {
        setFeaturedStory(storyRes.data[0]);
      } else {
        const latestS = await supabase.from('stories').select('*').limit(1);
        if (latestS.data) setFeaturedStory(latestS.data[0]);
      }

      // 5. Categories
      const catRes = await supabase.from('categories').select('*').limit(8);
      if (catRes.data) setCategories(catRes.data);

      // 6. Trending (by highest views across poetry & articles)
      const trendingItems = [];
      const kTrending = await supabase.from('kavithai').select('*').order('views', { ascending: false }).limit(2);
      const aTrending = await supabase.from('philosophy_articles').select('*').order('views', { ascending: false }).limit(2);
      
      if (kTrending.data) {
        kTrending.data.forEach(item => trendingItems.push({ ...item, type: 'kavithai' }));
      }
      if (aTrending.data) {
        aTrending.data.forEach(item => trendingItems.push({ ...item, type: 'philosophy' }));
      }
      
      // Sort united trending list by views
      trendingItems.sort((a, b) => b.views - a.views);
      setTrending(trendingItems.slice(0, 3));
      
    } catch (err) {
      console.error('Error fetching home data:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleShare = (type, title, content) => {
    const text = `"${content}"\n\n- ${title}\nExplore more at Tamil Literature Platform.`;
    navigator.clipboard.writeText(text);
    addNotification(language === 'ta' ? 'பகிர்வு இணைப்பு நகலெடுக்கப்பட்டது!' : 'Share text copied to clipboard!', 'success');
  };

  const isLiked = (type, id) => userLikes.some(l => l.content_type === type && l.content_id === id);
  const isBookmarked = (type, id) => userBookmarks.some(b => b.content_type === type && b.content_id === id);

  return (
    <div>
      <SEO title="Home" />
      
      {/* Hero Banner */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="container">
          <h1 className="hero-title">{t('siteTitle')}</h1>
          <p className="hero-desc">{t('tagline')}</p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="search-wrapper">
            <Search className="search-icon-svg" size={20} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>

          {/* Category shortcuts */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {categories.map((cat) => (
              <span 
                key={cat.id} 
                className="cat-chip"
                onClick={() => navigate(`/${cat.type === 'all' ? 'quotes' : cat.type}?category=${cat.slug}`)}
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Grid Section */}
      <section style={{ padding: '3rem 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem'
          }}>
            {/* Left Column: Quote of the Day & Featured Poetry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Quote of the Day */}
              {quoteOfTheDay && (
                <div className="card quote-card">
                  <span className="card-tag">{t('quoteOfTheDay')}</span>
                  <p className="quote-content">“{quoteOfTheDay.content}”</p>
                  <p className="quote-author">— {quoteOfTheDay.author}</p>
                  
                  <div className="card-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0' }}>
                    <div className="action-icons">
                      <span 
                        className={`action-icon ${isLiked('quotes', quoteOfTheDay.id) ? 'liked' : ''}`}
                        onClick={() => toggleLike('quotes', quoteOfTheDay.id)}
                      >
                        <Heart size={18} fill={isLiked('quotes', quoteOfTheDay.id) ? 'currentColor' : 'none'} />
                      </span>
                      <span 
                        className={`action-icon ${isBookmarked('quotes', quoteOfTheDay.id) ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark('quotes', quoteOfTheDay.id)}
                      >
                        <Bookmark size={18} fill={isBookmarked('quotes', quoteOfTheDay.id) ? 'currentColor' : 'none'} />
                      </span>
                      <span 
                        className="action-icon"
                        onClick={() => handleShare('quotes', quoteOfTheDay.author, quoteOfTheDay.content)}
                      >
                        <Share2 size={18} />
                      </span>
                    </div>
                    <span>{quoteOfTheDay.views || 0} views</span>
                  </div>
                </div>
              )}

              {/* Featured Kavithai */}
              {featuredKavithai && (
                <div className="card" onClick={() => navigate('/kavithai')} style={{ cursor: 'pointer' }}>
                  <div>
                    <span className="card-tag">{t('featuredKavithai')}</span>
                    <h3 className="card-title">{featuredKavithai.title}</h3>
                    <p style={{
                      whiteSpace: 'pre-line',
                      fontStyle: 'italic',
                      lineHeight: '1.8',
                      color: 'var(--text-secondary)',
                      fontSize: '1.05rem',
                      maxHeight: '160px',
                      overflow: 'hidden',
                      maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                    }}>
                      {featuredKavithai.content}
                    </p>
                  </div>
                  
                  <div className="card-footer" style={{ borderTop: 'none', padding: '1rem 0 0' }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>
                      — {featuredKavithai.author}
                    </span>
                    <div className="action-icons">
                      <span 
                        className={`action-icon ${isLiked('kavithai', featuredKavithai.id) ? 'liked' : ''}`}
                        onClick={() => toggleLike('kavithai', featuredKavithai.id)}
                      >
                        <Heart size={16} fill={isLiked('kavithai', featuredKavithai.id) ? 'currentColor' : 'none'} />
                      </span>
                      <span 
                        className={`action-icon ${isBookmarked('kavithai', featuredKavithai.id) ? 'bookmarked' : ''}`}
                        onClick={() => toggleBookmark('kavithai', featuredKavithai.id)}
                      >
                        <Bookmark size={16} fill={isBookmarked('kavithai', featuredKavithai.id) ? 'currentColor' : 'none'} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Featured Philosophy Article & Featured Short Story */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Featured Philosophy Article */}
              {featuredArticle && (
                <div className="card" onClick={() => navigate('/philosophy')} style={{ cursor: 'pointer' }}>
                  <div>
                    <span className="card-tag">{t('featuredPhilosophy')}</span>
                    <h3 className="card-title">{featuredArticle.title}</h3>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      display: '-webkit-box',
                      WebkitLineClamp: '4',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '1rem'
                    }}>
                      {featuredArticle.content.replace(/[#*`>]/g, '')}
                    </p>
                  </div>
                  
                  <div className="card-footer" style={{ borderTop: 'none', padding: '1rem 0 0' }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} />
                      {featuredArticle.reading_time} {t('minutes')} {t('readTime')}
                    </span>
                    <span style={{ fontWeight: 600 }}>By {featuredArticle.author}</span>
                  </div>
                </div>
              )}

              {/* Featured Story */}
              {featuredStory && (
                <div className="card" onClick={() => navigate('/stories')} style={{ cursor: 'pointer' }}>
                  <div>
                    <span className="card-tag">{t('featuredStory')}</span>
                    <h3 className="card-title">{featuredStory.title}</h3>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      display: '-webkit-box',
                      WebkitLineClamp: '4',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '1rem'
                    }}>
                      {featuredStory.content.replace(/[#*`>]/g, '')}
                    </p>
                  </div>
                  
                  <div className="card-footer" style={{ borderTop: 'none', padding: '1rem 0 0' }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BookOpen size={14} />
                      {featuredStory.reading_time} {t('minutes')} {t('readTime')}
                    </span>
                    <span style={{ fontWeight: 600 }}>By {featuredStory.author}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trending & Latest Content */}
      <section style={{ padding: '3rem 0', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('trendingContent')}</h2>
          </div>
          
          <div className="grid grid-cols-3">
            {trending.map((item) => (
              <div 
                key={item.id} 
                className="card" 
                onClick={() => navigate(item.type === 'kavithai' ? '/kavithai' : '/philosophy')}
                style={{ cursor: 'pointer', backgroundColor: 'var(--bg-primary)' }}
              >
                <div>
                  <span className="card-tag" style={{ textTransform: 'capitalize' }}>{item.type}</span>
                  <h3 className="card-title" style={{ fontSize: '1.15rem' }}>{item.title}</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.content.replace(/[#*`>]/g, '')}
                  </p>
                </div>
                
                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <span>By {item.author}</span>
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {item.views || 0} views <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Submission CTA Banner */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'var(--accent-gradient)',
              filter: 'blur(80px)',
              opacity: 0.1,
              borderRadius: '50%'
            }} />
            
            <PenTool size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
            
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem' }}>{t('ctaTitle')}</h2>
            <p style={{
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              margin: '0 auto 2.5rem',
              fontSize: '1.1rem',
              lineHeight: '1.7'
            }}>{t('ctaDesc')}</p>
            
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              {t('ctaButton')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
