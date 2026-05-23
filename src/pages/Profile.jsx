import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { User, Bookmark, Heart, Send, PenTool, FileText, Settings, Upload } from 'lucide-react';
import SEO from '../components/SEO';
import RichTextEditor from '../components/RichTextEditor';

const Profile = () => {
  const { profile, language, addNotification, userLikes, userBookmarks, fetchProfile } = useApp();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions', 'bookmarks', 'likes', 'settings'

  // Edit profile states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Content Submission form states
  const [showSubForm, setShowSubForm] = useState(false);
  const [subType, setSubType] = useState('quotes'); // 'quotes', 'kavithai', 'philosophy', 'stories'
  const [subTitle, setSubTitle] = useState('');
  const [subContent, setSubContent] = useState('');
  const [subAuthor, setSubAuthor] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subTags, setSubTags] = useState('');
  const [submits, setSubmits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Cached bookmark details
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [likedItems, setLikedItems] = useState([]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio || '');
      setProfileImage(profile.profile_image || '');
      fetchUserSubmissions();
      fetchInteractionsContent();
    }
  }, [profile, userBookmarks, userLikes]);

  useEffect(() => {
    fetchCategories();
  }, [subType]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('type', subType);
    if (data) {
      setCategories(data);
      if (data.length > 0) setSubCategory(data[0].slug);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (data) setSubmits(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInteractionsContent = async () => {
    try {
      // Bookmarks Content fetching
      const bContent = [];
      for (const b of userBookmarks) {
        const table = b.content_type === 'philosophy' ? 'philosophy_articles' : b.content_type;
        const { data } = await supabase.from(table).select('*').eq('id', b.content_id).single();
        if (data) bContent.push({ ...data, type: b.content_type });
      }
      setBookmarkedItems(bContent);

      // Likes Content fetching
      const lContent = [];
      for (const l of userLikes) {
        const table = l.content_type === 'philosophy' ? 'philosophy_articles' : l.content_type;
        const { data } = await supabase.from(table).select('*').eq('id', l.content_id).single();
        if (data) lContent.push({ ...data, type: l.content_type });
      }
      setLikedItems(lContent);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username, bio, profile_image: profileImage }
      });
      if (error) throw error;
      addNotification(language === 'ta' ? 'சுயவிவரம் புதுப்பிக்கப்பட்டது.' : 'Profile updated successfully.', 'success');
      await fetchProfile(profile.id);
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { data, error } = await supabase.storage.from('images').upload(filePath, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      setProfileImage(urlData.publicUrl);
      addNotification(language === 'ta' ? 'சுயவிவரப் படம் பதிவேற்றப்பட்டது.' : 'Avatar image uploaded successfully.', 'success');
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();
    if (!subContent.trim()) {
      addNotification(language === 'ta' ? 'படைப்பு உள்ளடக்கத்தை உள்ளிடவும்.' : 'Content cannot be empty.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newSubmission = {
        user_id: profile.id,
        content_type: subType,
        title: subTitle || null,
        content: subContent,
        author: subAuthor || profile.username,
        category: subCategory || null,
        tags: subTags ? subTags.split(',').map(t => t.trim()) : [],
        status: 'pending'
      };

      const { error } = await supabase.from('submissions').insert(newSubmission);
      if (error) throw error;

      addNotification(
        language === 'ta' 
          ? 'படைப்பு சமர்ப்பிக்கப்பட்டது! நிர்வாகி ஒப்புதலுக்குப் பின் வெளியாகும்.' 
          : 'Content submitted successfully! Awaiting review.', 
        'success'
      );
      
      // Clear form
      setSubTitle('');
      setSubContent('');
      setSubAuthor('');
      setSubTags('');
      setShowSubForm(false);
      
      await fetchUserSubmissions();
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SEO title="User Dashboard" />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '2rem' }}>
          {language === 'ta' ? 'என் கணக்கு' : 'Dashboard'}
        </h1>

        <div className="dashboard-layout">
          {/* Sidebar Tabs Controls */}
          <div className="sidebar">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <img 
                src={profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username}`} 
                alt="Avatar" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', marginBottom: '0.75rem' }} 
              />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{profile?.username}</h3>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
                {profile?.role}
              </span>
            </div>

            <ul className="sidebar-menu">
              <li className={`sidebar-item ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
                <PenTool size={16} /> {language === 'ta' ? 'என் படைப்புகள்' : 'Submissions'}
              </li>
              <li className={`sidebar-item ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
                <Bookmark size={16} /> {language === 'ta' ? 'புத்தகக்குறிகள்' : 'Bookmarks'}
              </li>
              <li className={`sidebar-item ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
                <Heart size={16} /> {language === 'ta' ? 'விருப்பங்கள்' : 'Liked Items'}
              </li>
              <li className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                <Settings size={16} /> {language === 'ta' ? 'அமைப்புகள்' : 'Edit Profile'}
              </li>
            </ul>
          </div>

          {/* Main Panel Content */}
          <div>
            {/* SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{language === 'ta' ? 'படைப்பு மேலாண்மை' : 'My Content Submissions'}</h2>
                  <button className="btn btn-primary" onClick={() => setShowSubForm(!showSubForm)}>
                    {showSubForm ? 'Close Form' : language === 'ta' ? 'புதிய படைப்பு சமர்ப்பி' : 'Submit New Content'}
                  </button>
                </div>

                {/* Submission Form */}
                {showSubForm && (
                  <form onSubmit={handleSubmitContent} className="card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>
                      {language === 'ta' ? 'புதிய படைப்பை எழுதவும்' : 'Submit New Literature Piece'}
                    </h3>

                    {/* Content Type Selector */}
                    <div className="form-group">
                      <label className="form-label">Content Type</label>
                      <select 
                        value={subType} 
                        onChange={(e) => setSubType(e.target.value)} 
                        className="form-control"
                      >
                        <option value="quotes">Quote</option>
                        <option value="kavithai">Kavithai (Poetry)</option>
                        <option value="philosophy">Philosophy Article</option>
                        <option value="stories">Short Story</option>
                      </select>
                    </div>

                    {/* Title (Not required for Quotes) */}
                    {subType !== 'quotes' && (
                      <div className="form-group">
                        <label className="form-label">{language === 'ta' ? 'தலைப்பு' : 'Title'}</label>
                        <input
                          type="text"
                          placeholder="My masterpiece title"
                          value={subTitle}
                          onChange={(e) => setSubTitle(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>
                    )}

                    {/* Rich Content Editor */}
                    <div className="form-group">
                      <label className="form-label">{language === 'ta' ? 'உள்ளடக்கம்' : 'Content body'}</label>
                      <RichTextEditor 
                        value={subContent} 
                        onChange={setSubContent} 
                        placeholder={
                          subType === 'quotes' 
                            ? 'உள்ளடக்கம் (மேற்கோள்)...' 
                            : subType === 'kavithai'
                              ? 'கவிதை வரிகளை இங்கு எழுதவும்...'
                              : 'கட்டுரை அல்லது கதையை இங்கு எழுதவும் (Use markdown formatting)...'
                        }
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Category */}
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select 
                          value={subCategory} 
                          onChange={(e) => setSubCategory(e.target.value)} 
                          className="form-control"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Author */}
                      <div className="form-group">
                        <label className="form-label">{language === 'ta' ? 'ஆசிரியர் பெயர்' : 'Author Display Name'}</label>
                        <input
                          type="text"
                          placeholder={profile?.username}
                          value={subAuthor}
                          onChange={(e) => setSubAuthor(e.target.value)}
                          className="form-control"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="form-group">
                      <label className="form-label">{language === 'ta' ? 'குறிச்சொற்கள்' : 'Tags (comma separated)'}</label>
                      <input
                        type="text"
                        placeholder="hope, life, peace"
                        value={subTags}
                        onChange={(e) => setSubTags(e.target.value)}
                        className="form-control"
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '48px', width: '100%', marginTop: '1rem' }}>
                      {submitting ? 'Submitting...' : 'Submit to Moderator Queue'}
                    </button>
                  </form>
                )}

                {/* Submissions List Queue */}
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>
                  {language === 'ta' ? 'சமர்ப்பித்தவை' : 'Submissions Log'}
                </h3>
                
                {submits.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Title / Content excerpt</th>
                          <th>Status</th>
                          <th>Moderator Notes</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submits.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{sub.content_type}</td>
                            <td>
                              <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <strong>{sub.title || 'Quote'}</strong> - {sub.content}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge status-${sub.status}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              {sub.moderator_notes || '—'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(sub.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No submissions yet.</p>
                )}
              </div>
            )}

            {/* BOOKMARKS TAB */}
            {activeTab === 'bookmarks' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{language === 'ta' ? 'சேமிக்கப்பட்டவை' : 'Bookmarked Literature'}</h2>
                
                {bookmarkedItems.length > 0 ? (
                  <div className="grid grid-cols-2">
                    {bookmarkedItems.map((item) => (
                      <div key={item.id} className="card" style={{ minHeight: '140px' }}>
                        <div>
                          <span className="card-tag" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{item.type}</span>
                          <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{item.title || 'Quote'}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.content.replace(/[#*`>]/g, '')}
                          </p>
                        </div>
                        <div className="card-footer" style={{ border: 'none', padding: 0, marginTop: '1rem' }}>
                          <span>By {item.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No bookmarked items yet.</p>
                )}
              </div>
            )}

            {/* LIKES TAB */}
            {activeTab === 'likes' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{language === 'ta' ? 'பிடித்தவை' : 'Liked Literature'}</h2>
                
                {likedItems.length > 0 ? (
                  <div className="grid grid-cols-2">
                    {likedItems.map((item) => (
                      <div key={item.id} className="card" style={{ minHeight: '140px' }}>
                        <div>
                          <span className="card-tag" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{item.type}</span>
                          <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{item.title || 'Quote'}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.content.replace(/[#*`>]/g, '')}
                          </p>
                        </div>
                        <div className="card-footer" style={{ border: 'none', padding: 0, marginTop: '1rem' }}>
                          <span>By {item.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No liked items yet.</p>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <form onSubmit={handleUpdateProfile} className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{language === 'ta' ? 'சுயவிவர எடிட்டர்' : 'Edit Profile Settings'}</h2>

                {/* Profile Avatar Upload */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                  <img 
                    src={profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username}`} 
                    alt="Avatar" 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)' }} 
                  />
                  <div>
                    <label className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <Upload size={14} /> Upload Picture
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfileImageUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>JPG, PNG or GIF up to 2MB.</p>
                  </div>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label className="form-label">{language === 'ta' ? 'பயனர் பெயர்' : 'Username'}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                {/* Biography */}
                <div className="form-group">
                  <label className="form-label">{language === 'ta' ? 'சுயவிவர உரை' : 'Biography'}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-control"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={updatingProfile} style={{ height: '44px', width: 'max-content', padding: '0.5rem 2rem' }}>
                  {updatingProfile ? 'Saving...' : 'Save Profile Details'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
