import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en'); // 'ta' or 'en'
  const [notifications, setNotifications] = useState([]); // Toast alerts queue
  
  // Likes and bookmarks cached states for rapid UI feedback
  const [userLikes, setUserLikes] = useState([]);
  const [userBookmarks, setUserBookmarks] = useState([]);

  // Toast notification helper
  const addNotification = (message, type = 'success') => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Synchronize authentication
  useEffect(() => {
    let authSubscription = null;

    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setUserLikes([]);
          setUserBookmarks([]);
          setLoading(false);
        }
      });
      authSubscription = data?.subscription;
    };

    setupAuth();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
        await fetchUserInteractions(userId);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async (userId) => {
    try {
      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from('likes').select('*').eq('user_id', userId),
        supabase.from('bookmarks').select('*').eq('user_id', userId)
      ]);
      if (likesRes.data) setUserLikes(likesRes.data);
      if (bookmarksRes.data) setUserBookmarks(bookmarksRes.data);
    } catch (err) {
      console.error('Error fetching user interactions:', err);
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Toggle Language
  const toggleLanguage = () => {
    const nextLang = language === 'ta' ? 'en' : 'ta';
    setLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  // Core Interactions: LIKES
  const toggleLike = async (contentType, contentId) => {
    if (!profile) {
      addNotification(language === 'ta' ? 'விருப்பம் தெரிவிக்க முதலில் உள்நுழையவும்.' : 'Please log in to like content.', 'error');
      return false;
    }

    const isLiked = userLikes.some(
      (l) => l.content_type === contentType && l.content_id === contentId
    );

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', profile.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
        
        if (!error) {
          setUserLikes((prev) =>
            prev.filter(
              (l) => !(l.content_type === contentType && l.content_id === contentId)
            )
          );
          addNotification(language === 'ta' ? 'விருப்பம் நீக்கப்பட்டது.' : 'Removed from likes.', 'success');
          return true;
        }
      } else {
        // Like
        const { error } = await supabase.from('likes').insert({
          user_id: profile.id,
          content_type: contentType,
          content_id: contentId
        });
        
        if (!error) {
          setUserLikes((prev) => [
            ...prev,
            { user_id: profile.id, content_type: contentType, content_id: contentId }
          ]);
          addNotification(language === 'ta' ? 'உங்களுக்கு இது பிடித்துள்ளது!' : 'Added to liked items!', 'success');
          return true;
        }
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Core Interactions: BOOKMARKS
  const toggleBookmark = async (contentType, contentId) => {
    if (!profile) {
      addNotification(language === 'ta' ? 'புத்தகக்குறியிட முதலில் உள்நுழையவும்.' : 'Please log in to bookmark content.', 'error');
      return false;
    }

    const isBookmarked = userBookmarks.some(
      (b) => b.content_type === contentType && b.content_id === contentId
    );

    try {
      if (isBookmarked) {
        // Unbookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', profile.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
        
        if (!error) {
          setUserBookmarks((prev) =>
            prev.filter(
              (b) => !(b.content_type === contentType && b.content_id === contentId)
            )
          );
          addNotification(language === 'ta' ? 'புத்தகக்குறியிலிருந்து நீக்கப்பட்டது.' : 'Removed from bookmarks.', 'success');
          return true;
        }
      } else {
        // Bookmark
        const { error } = await supabase.from('bookmarks').insert({
          user_id: profile.id,
          content_type: contentType,
          content_id: contentId
        });
        
        if (!error) {
          setUserBookmarks((prev) => [
            ...prev,
            { user_id: profile.id, content_type: contentType, content_id: contentId }
          ]);
          addNotification(language === 'ta' ? 'புத்தகக்குறியில் சேர்க்கப்பட்டது!' : 'Added to bookmarks!', 'success');
          return true;
        }
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Helper translations dictionary
  const t = (key) => {
    const translations = {
      // General
      siteTitle: { ta: 'தமிழ் இலக்கியம் & தத்துவம்', en: 'Tamil Literature & Philosophy' },
      tagline: { ta: 'படைப்புகள், கவிதைகள் மற்றும் தத்துவங்களின் சங்கமம்', en: 'A Sangam of Poetry, Philosophy, and Stories' },
      searchPlaceholder: { ta: 'கவிதைகள், மேற்கோள்கள், கதைகளைத் தேடுக...', en: 'Search quotes, poems, stories, articles...' },
      explore: { ta: 'கண்டறிக', en: 'Explore' },
      submitContent: { ta: 'படைப்பைச் சமர்ப்பி', en: 'Submit Content' },
      about: { ta: 'பற்றி', en: 'About' },
      login: { ta: 'உள்நுழைக', en: 'Log In' },
      logout: { ta: 'வெளியேறு', en: 'Log Out' },
      register: { ta: 'பதிவு செய்க', en: 'Sign Up' },
      profile: { ta: 'சுயவிவரம்', en: 'My Profile' },
      adminDashboard: { ta: 'நிர்வாகப் பலகை', en: 'Admin Panel' },
      
      // Sections
      quotes: { ta: 'மேற்கோள்கள்', en: 'Quotes' },
      kavithai: { ta: 'கவிதைகள்', en: 'Kavithai (Poetry)' },
      philosophy: { ta: 'தத்துவம்', en: 'Philosophy' },
      stories: { ta: 'கதைகள்', en: 'Stories' },
      authors: { ta: 'எழுத்தாளர்கள்', en: 'Authors' },
      categories: { ta: 'பிரிவுகள்', en: 'Categories' },
      search: { ta: 'தேடல்', en: 'Search' },

      // Submissions
      title: { ta: 'தலைப்பு', en: 'Title' },
      content: { ta: 'படைப்பு உள்ளடக்கம்', en: 'Content' },
      authorName: { ta: 'எழுத்தாளர் பெயர்', en: 'Author Name' },
      categorySelect: { ta: 'பிரிவைத் தேர்ந்தெடுக்கவும்', en: 'Select Category' },
      tagsHelp: { ta: 'குறிச்சொற்கள் (காற்புள்ளியால் பிரிக்கவும்)', en: 'Tags (comma separated)' },
      submitBtn: { ta: 'சமர்ப்பிக்கவும்', en: 'Submit for Review' },
      submissionSuccess: { ta: 'உங்கள் படைப்பு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. நிர்வாகி ஒப்புதலுக்குப் பின் வெளியிடப்படும்.', en: 'Your content has been submitted successfully for moderator review.' },

      // Home
      quoteOfTheDay: { ta: 'இன்றைய மேற்கோள்', en: 'Quote of the Day' },
      featuredKavithai: { ta: 'சிறப்புக் கவிதை', en: 'Featured Poetry' },
      featuredPhilosophy: { ta: 'சிறப்புத் தத்துவக் கட்டுரை', en: 'Featured Philosophy' },
      featuredStory: { ta: 'சிறப்புக் கதை', en: 'Featured Story' },
      trendingContent: { ta: 'பிரபலமானவை', en: 'Trending Content' },
      latestContent: { ta: 'புதிய படைப்புகள்', en: 'Latest Content' },
      readMore: { ta: 'மேலும் வாசிக்க', en: 'Read More' },
      readTime: { ta: 'வாசிப்பு நேரம்', en: 'Reading Time' },
      minutes: { ta: 'நிமிடங்கள்', en: 'mins' },
      categoryShortcuts: { ta: 'பிரிவுகளின் குறுக்குவழிகள்', en: 'Explore by Category' },
      ctaTitle: { ta: 'உங்கள் படைப்புகளைப் பகிர விரும்புகிறீர்களா?', en: 'Want to Share Your Creative Works?' },
      ctaDesc: { ta: 'உங்கள் கவிதைகள், தத்துவங்கள் மற்றும் கதைகளை எங்கள் தளத்தில் சமர்ப்பியுங்கள். ஆயிரக்கணக்கான வாசகர்களைச் சென்றடையுங்கள்.', en: 'Submit your poems, philosophical thoughts, and short stories. Connect with thousands of global readers.' },
      ctaButton: { ta: 'படைப்பை எழுதத் தொடங்குங்கள்', en: 'Start Writing Now' }
    };

    return translations[key]?.[language] || key;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        toggleTheme,
        language,
        toggleLanguage,
        notifications,
        addNotification,
        removeNotification,
        userLikes,
        userBookmarks,
        toggleLike,
        toggleBookmark,
        fetchProfile,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
