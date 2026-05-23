import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import { Layers, MessageSquare, Feather, Compass, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';

const Categories = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetchCategoriesAndCounts();
  }, []);

  const fetchCategoriesAndCounts = async () => {
    try {
      // 1. Fetch categories
      const { data: cats } = await supabase.from('categories').select('*');
      
      // 2. Fetch counts
      const [qData, kData, aData, sData] = await Promise.all([
        supabase.from('quotes').select('category').eq('status', 'approved'),
        supabase.from('kavithai').select('category').eq('status', 'approved'),
        supabase.from('philosophy_articles').select('category').eq('status', 'approved'),
        supabase.from('stories').select('category').eq('status', 'approved')
      ]);

      const countMap = {};
      
      const countItems = (list) => {
        if (!list) return;
        list.forEach(item => {
          if (item.category) {
            countMap[item.category] = (countMap[item.category] || 0) + 1;
          }
        });
      };

      countItems(qData.data);
      countItems(kData.data);
      countItems(aData.data);
      countItems(sData.data);

      setCounts(countMap);
      if (cats) setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'quotes') return <MessageSquare size={18} />;
    if (type === 'kavithai') return <Feather size={18} />;
    if (type === 'philosophy') return <Compass size={18} />;
    return <BookOpen size={18} />;
  };

  const handleCategoryClick = (cat) => {
    const sectionPath = cat.type === 'philosophy' ? 'philosophy' : (cat.type === 'all' ? 'quotes' : cat.type);
    navigate(`/${sectionPath}?category=${cat.slug}`);
  };

  return (
    <div>
      <SEO title="Categories" description="Browse Tamil and English poetry, stories, wisdom articles, and motivational quotes by categories." />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Layers size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {language === 'ta' ? 'படைப்புப் பிரிவுகள்' : 'Content Categories'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {language === 'ta' ? 'அனைத்து தலைப்புகளின் கீழ் படைப்புகளை ஆராயுங்கள்' : 'Explore diverse writings organized by philosophical and literary themes.'}
          </p>
        </div>

        {/* Categories Grouped by Type */}
        {['quotes', 'kavithai', 'philosophy', 'stories'].map(type => {
          const typeCats = categories.filter(c => c.type === type);
          if (typeCats.length === 0) return null;

          return (
            <div key={type} style={{ marginBottom: '3.5rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {getTypeIcon(type)}
                {type === 'quotes' && (language === 'ta' ? 'மேற்கோள் பிரிவுகள்' : 'Quotes Categories')}
                {type === 'kavithai' && (language === 'ta' ? 'கவிதைப் பிரிவுகள்' : 'Poetry Categories')}
                {type === 'philosophy' && (language === 'ta' ? 'தத்துவப் பிரிவுகள்' : 'Philosophy Categories')}
                {type === 'stories' && (language === 'ta' ? 'கதைப் பிரிவுகள்' : 'Stories Categories')}
              </h2>

              <div className="grid grid-cols-3">
                {typeCats.map(cat => (
                  <div
                    key={cat.id}
                    className="card"
                    onClick={() => handleCategoryClick(cat)}
                    style={{ cursor: 'pointer', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 className="card-title" style={{ fontSize: '1.15rem', marginBottom: 0 }}>{cat.name}</h3>
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--accent-secondary)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          {counts[cat.slug] || 0} {counts[cat.slug] === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {cat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
