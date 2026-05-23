import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import { Search as SearchIcon, Heart, Bookmark, Eye, MessageSquare, Feather, Compass, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';

const Search = () => {
  const { language, toggleLike, toggleBookmark, userLikes, userBookmarks, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'quotes', 'kavithai', 'philosophy', 'stories'

  useEffect(() => {
    setSearchQuery(queryParam);
    if (queryParam.trim()) {
      performSearch(queryParam);
    } else {
      setResults([]);
    }
  }, [queryParam]);

  const performSearch = async (term) => {
    setLoading(true);
    try {
      const q = term.toLowerCase();

      // Query all approved contents
      const [qRes, kRes, aRes, sRes] = await Promise.all([
        supabase.from('quotes').select('*').eq('status', 'approved'),
        supabase.from('kavithai').select('*').eq('status', 'approved'),
        supabase.from('philosophy_articles').select('*').eq('status', 'approved'),
        supabase.from('stories').select('*').eq('status', 'approved')
      ]);

      const merged = [];

      const filterList = (list, type) => {
        if (!list) return;
        list.forEach(item => {
          const matchTitle = item.title && item.title.toLowerCase().includes(q);
          const matchContent = item.content && item.content.toLowerCase().includes(q);
          const matchAuthor = item.author && item.author.toLowerCase().includes(q);
          const matchCategory = item.category && item.category.toLowerCase().includes(q);
          const matchTags = item.tags && item.tags.some(tag => tag.toLowerCase().includes(q));

          if (matchTitle || matchContent || matchAuthor || matchCategory || matchTags) {
            merged.push({ ...item, type });
          }
        });
      };

      filterList(qRes.data, 'quotes');
      filterList(kRes.data, 'kavithai');
      filterList(aRes.data, 'philosophy');
      filterList(sRes.data, 'stories');

      setResults(merged);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const getSectionIcon = (type) => {
    if (type === 'quotes') return <MessageSquare size={16} />;
    if (type === 'kavithai') return <Feather size={16} />;
    if (type === 'philosophy') return <Compass size={16} />;
    return <BookOpen size={16} />;
  };

  const handleResultClick = (item) => {
    const sectionPath = item.type === 'philosophy' ? 'philosophy' : (item.type === 'all' ? 'quotes' : item.type);
    navigate(`/${sectionPath}`); // Redirects to listing where detail can be viewed, or opens
  };

  const filteredResults = filterType === 'all' 
    ? results 
    : results.filter(r => r.type === filterType);

  const isLiked = (type, id) => userLikes.some(l => l.content_type === type && l.content_id === id);
  const isBookmarked = (type, id) => userBookmarks.some(b => b.content_type === type && b.content_id === id);

  return (
    <div>
      <SEO title="Search Results" />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
          {language === 'ta' ? 'தேடல் முடிவுகள்' : 'Search Results'}
        </h1>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="search-wrapper">
          <SearchIcon className="search-icon-svg" size={18} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ padding: '0.75rem 1.5rem 0.75rem 3rem' }}
          />
        </form>

        {/* Type Filter Buttons */}
        {results.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2.5rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <button className={`tab-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
              All ({results.length})
            </button>
            <button className={`tab-btn ${filterType === 'quotes' ? 'active' : ''}`} onClick={() => setFilterType('quotes')}>
              Quotes ({results.filter(r => r.type === 'quotes').length})
            </button>
            <button className={`tab-btn ${filterType === 'kavithai' ? 'active' : ''}`} onClick={() => setFilterType('kavithai')}>
              Poetry ({results.filter(r => r.type === 'kavithai').length})
            </button>
            <button className={`tab-btn ${filterType === 'philosophy' ? 'active' : ''}`} onClick={() => setFilterType('philosophy')}>
              Philosophy ({results.filter(r => r.type === 'philosophy').length})
            </button>
            <button className={`tab-btn ${filterType === 'stories' ? 'active' : ''}`} onClick={() => setFilterType('stories')}>
              Stories ({results.filter(r => r.type === 'stories').length})
            </button>
          </div>
        )}

        {/* Results view */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Searching database...</div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2">
            {filteredResults.map((item) => (
              <div 
                key={item.id} 
                className="card"
                onClick={() => handleResultClick(item)}
                style={{ cursor: 'pointer', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span 
                      className="card-tag" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        textTransform: 'uppercase', 
                        fontSize: '0.7rem',
                        marginBottom: 0
                      }}
                    >
                      {getSectionIcon(item.type)} {item.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                  </div>

                  {item.title && <h3 className="card-title" style={{ fontSize: '1.2rem' }}>{item.title}</h3>}
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: item.type === 'kavithai' ? 'pre-line' : 'normal',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontStyle: item.type === 'quotes' || item.type === 'kavithai' ? 'italic' : 'normal'
                  }}>
                    {item.content.replace(/[#*`>]/g, '')}
                  </p>
                </div>

                <div className="card-footer" onClick={(e) => e.stopPropagation()}>
                  <span>By {item.author}</span>
                  <div className="action-icons">
                    <button 
                      className={`action-icon ${isLiked(item.type, item.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike(item.type, item.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Heart size={15} fill={isLiked(item.type, item.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      className={`action-icon ${isBookmarked(item.type, item.id) ? 'bookmarked' : ''}`}
                      onClick={() => toggleBookmark(item.type, item.id)}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <Bookmark size={15} fill={isBookmarked(item.type, item.id) ? 'currentColor' : 'none'} />
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', fontSize: '0.75rem' }}>
                      <Eye size={12} /> {item.views || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : queryParam ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>No results found matching "{queryParam}".</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try different keywords or browse categories.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>Please enter keywords in the search bar above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
