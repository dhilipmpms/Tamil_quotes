import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import { Shield, Eye, Trash2, Check, X, Edit3, Award, Users, BookOpen, Layers, Star, Plus } from 'lucide-react';
import SEO from '../components/SEO';
import Modal from '../components/Modal';
import RichTextEditor from '../components/RichTextEditor';

const AdminDashboard = () => {
  const { language, addNotification } = useApp();
  
  // Tabs
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation', 'crud', 'featured'
  const [crudSubTab, setCrudSubTab] = useState('quotes'); // 'quotes', 'kavithai', 'articles', 'stories', 'categories', 'users'

  // System Stats
  const [stats, setStats] = useState({
    users: 0,
    quotes: 0,
    kavithai: 0,
    articles: 0,
    stories: 0,
    submissions: 0,
    pending: 0
  });

  // Data states
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [crudItems, setCrudItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Moderation action states
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  // Edit Submission / Content Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(''); // 'submissions', 'quotes', 'kavithai', 'articles', 'stories', 'categories'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for Create/Edit CRUD
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('life');
  const [formLanguage, setFormLanguage] = useState('ta');
  const [formTags, setFormTags] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formReadingTime, setFormReadingTime] = useState(5);
  const [categories, setCategories] = useState([]);

  // Create Category form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catType, setCatType] = useState('quotes');

  useEffect(() => {
    fetchStats();
    fetchPendingSubmissions();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCrudItems();
  }, [activeTab, crudSubTab]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchStats = async () => {
    try {
      const [u, q, k, a, s, sub] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('quotes').select('*', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('kavithai').select('*', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('philosophy_articles').select('*', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('stories').select('*', { count: 'exact' }).eq('status', 'approved'),
        supabase.from('submissions').select('*')
      ]);

      setStats({
        users: u.data?.length || 0,
        quotes: q.data?.length || 0,
        kavithai: k.data?.length || 0,
        articles: a.data?.length || 0,
        stories: s.data?.length || 0,
        submissions: sub.data?.length || 0,
        pending: sub.data?.filter(item => item.status === 'pending').length || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingSubmissions = async () => {
    const { data } = await supabase.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (data) setPendingSubmissions(data);
  };

  const fetchCrudItems = async () => {
    if (activeTab !== 'crud') return;
    setLoading(true);
    try {
      const table = crudSubTab === 'articles' ? 'philosophy_articles' : (crudSubTab === 'users' ? 'profiles' : crudSubTab);
      const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (data) setCrudItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Moderation Actions
  const handleApprove = async (sub) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'approved', moderator_notes: 'Approved by Editor.' })
        .eq('id', sub.id);
      
      if (error) throw error;
      
      addNotification(language === 'ta' ? 'படைப்பு அங்கீகரிக்கப்பட்டு வெளியிடப்பட்டது.' : 'Content approved and published successfully.', 'success');
      await fetchPendingSubmissions();
      await fetchStats();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  const handleReject = async (id) => {
    if (!moderatorNotes.trim()) {
      addNotification(language === 'ta' ? 'நிராகரிப்பு காரணத்தை உள்ளிடவும்.' : 'Please add moderator notes before rejecting.', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'rejected', moderator_notes: moderatorNotes })
        .eq('id', id);
      
      if (error) throw error;
      
      addNotification(language === 'ta' ? 'படைப்பு நிராகரிக்கப்பட்டது.' : 'Submission rejected.', 'warning');
      setRejectingId(null);
      setModeratorNotes('');
      await fetchPendingSubmissions();
      await fetchStats();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // Edit form modal loader
  const handleLoadEdit = (item, type) => {
    setEditingItem(item);
    setEditType(type);
    
    // Set form fields
    setFormTitle(item.title || '');
    setFormContent(item.content || '');
    setFormAuthor(item.author || '');
    setFormCategory(item.category || '');
    setFormLanguage(item.language || 'ta');
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setFormFeatured(item.featured || false);
    setFormReadingTime(item.reading_time || 5);
    
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const updatedFields = {
        title: formTitle || null,
        content: formContent,
        author: formAuthor,
        category: formCategory,
        language: formLanguage,
        tags: formTags ? formTags.split(',').map(t => t.trim()) : [],
        featured: formFeatured,
        reading_time: parseInt(formReadingTime) || 5
      };

      if (editType === 'submissions') {
        // Update submission details
        const { error } = await supabase.from('submissions').update(updatedFields).eq('id', editingItem.id);
        if (error) throw error;
        addNotification('Submission updated. You can approve it now.', 'success');
        await fetchPendingSubmissions();
      } else {
        const table = editType === 'articles' ? 'philosophy_articles' : editType;
        const { error } = await supabase.from(table).update(updatedFields).eq('id', editingItem.id);
        if (error) throw error;
        addNotification('Content updated successfully.', 'success');
        await fetchCrudItems();
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // CRUD Delete
  const handleDeleteItem = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const table = type === 'articles' ? 'philosophy_articles' : (type === 'users' ? 'profiles' : type);
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      addNotification('Item deleted successfully.', 'success');
      await fetchCrudItems();
      await fetchStats();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // CREATE CRUD item helper
  const [showCreateForm, setShowCreateForm] = useState(false);
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      if (crudSubTab === 'categories') {
        const { error } = await supabase.from('categories').insert({
          name: catName,
          slug: catSlug || catName.toLowerCase().replace(/\s+/g, '-'),
          description: catDesc,
          type: catType
        });
        if (error) throw error;
        setCatName('');
        setCatSlug('');
        setCatDesc('');
        addNotification('Category created!', 'success');
      } else {
        const table = crudSubTab === 'articles' ? 'philosophy_articles' : crudSubTab;
        const { error } = await supabase.from(table).insert({
          title: formTitle || null,
          content: formContent,
          author: formAuthor || 'Editor',
          category: formCategory,
          language: formLanguage,
          tags: formTags ? formTags.split(',').map(t => t.trim()) : [],
          featured: formFeatured,
          reading_time: parseInt(formReadingTime) || 5,
          status: 'approved'
        });
        if (error) throw error;
        setFormTitle('');
        setFormContent('');
        setFormAuthor('');
        setFormTags('');
        addNotification('Content created and published!', 'success');
      }
      setShowCreateForm(false);
      await fetchCrudItems();
      await fetchStats();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // Featured toggle triggers
  const handleToggleFeatured = async (id, table, currentFeatured) => {
    try {
      // First, set featured = false for all others if it's quotes (Quote of the day is only one)
      if (table === 'quotes' && !currentFeatured) {
        await supabase.from('quotes').update({ featured: false }).eq('featured', true);
      }
      
      const { error } = await supabase.from(table).update({ featured: !currentFeatured }).eq('id', id);
      if (error) throw error;
      addNotification('Featured status updated.', 'success');
      await fetchCrudItems();
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  return (
    <div>
      <SEO title="Admin Dashboard" />

      <div className="container" style={{ paddingTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <Shield size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>{language === 'ta' ? 'நிர்வாகக் கட்டுப்பாட்டுப் பலகை' : 'Admin Operations Control'}</h1>
        </div>

        {/* STATS PANEL ROW */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label" style={{ color: 'var(--warning)' }}>Pending Approvals</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.quotes}</div>
            <div className="stat-label">Total Quotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.kavithai}</div>
            <div className="stat-label">Total Kavithai</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.articles}</div>
            <div className="stat-label">Total Articles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.stories}</div>
            <div className="stat-label">Total Stories</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.users}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        {/* DASHBOARD TAB SELECTOR */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>
            Moderation Queue ({pendingSubmissions.length})
          </button>
          <button className={`tab-btn ${activeTab === 'crud' ? 'active' : ''}`} onClick={() => setActiveTab('crud')}>
            System Content CRUD
          </button>
        </div>

        {/* MODERATION QUEUE TAB PANEL */}
        {activeTab === 'moderation' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Submission Moderation Queue</h2>
            
            {pendingSubmissions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {pendingSubmissions.map((sub) => (
                  <div key={sub.id} className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <span className="card-tag" style={{ textTransform: 'uppercase', marginBottom: 0 }}>{sub.content_type}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Submitted: {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>

                    {sub.title && <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>{sub.title}</h3>}
                    
                    <p style={{
                      whiteSpace: sub.content_type === 'kavithai' ? 'pre-line' : 'normal',
                      fontStyle: sub.content_type === 'quotes' || sub.content_type === 'kavithai' ? 'italic' : 'normal',
                      color: 'var(--text-primary)',
                      fontSize: '1.05rem',
                      lineHeight: '1.8',
                      marginBottom: '1.5rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '10px'
                    }}>
                      {sub.content}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Suggested Author: <strong>{sub.author}</strong> | Category: <strong>{sub.category}</strong>
                      </span>

                      {/* Mod Actions buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={() => handleApprove(sub)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          <Check size={14} /> Approve
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleLoadEdit(sub, 'submissions')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          <Edit3 size={14} /> Edit & Refine
                        </button>
                        <button className="btn btn-danger" onClick={() => setRejectingId(sub.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>

                    {/* Reject Dialog details box */}
                    {rejectingId === sub.id && (
                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Moderator Rejection Notes (Visible to user)</label>
                          <input 
                            type="text" 
                            placeholder="Reason for rejection, e.g., offensive content, duplicate..." 
                            value={moderatorNotes}
                            onChange={(e) => setModeratorNotes(e.target.value)}
                            className="form-control"
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-danger" onClick={() => handleReject(sub.id)}>Confirm Rejection</button>
                          <button className="btn btn-secondary" onClick={() => { setRejectingId(null); setModeratorNotes(''); }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No pending submissions to moderate. Good job!</p>
            )}
          </div>
        )}

        {/* CRUD MANAGEMENT TAB PANEL */}
        {activeTab === 'crud' && (
          <div>
            {/* CRUD Sub tabs selectors */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {['quotes', 'kavithai', 'articles', 'stories', 'categories', 'users'].map((tName) => (
                <button
                  key={tName}
                  className={`tab-btn ${crudSubTab === tName ? 'active' : ''}`}
                  onClick={() => { setCrudSubTab(tName); setShowCreateForm(false); }}
                  style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                >
                  {tName}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'capitalize' }}>Manage {crudSubTab}</h3>
              {crudSubTab !== 'users' && (
                <button className="btn btn-primary" onClick={() => { 
                  setShowCreateForm(!showCreateForm);
                  // Initialize default values for Create form
                  setFormTitle('');
                  setFormContent('');
                  setFormAuthor('');
                  setFormTags('');
                  setFormFeatured(false);
                }}>
                  <Plus size={16} /> {showCreateForm ? 'Close Form' : `Create ${crudSubTab.slice(0, -1)}`}
                </button>
              )}
            </div>

            {/* CREATE CRUD ITEM FORM PANEL */}
            {showCreateForm && (
              <form onSubmit={handleCreateItem} className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.5rem' }}>New {crudSubTab.slice(0,-1)} publish form</h3>
                
                {crudSubTab === 'categories' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Category Name</label>
                      <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Slug (Optional)</label>
                      <input type="text" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className="form-control" placeholder="auto-generated" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type Mapping</label>
                      <select value={catType} onChange={(e) => setCatType(e.target.value)} className="form-control">
                        <option value="quotes">Quotes</option>
                        <option value="kavithai">Kavithai</option>
                        <option value="philosophy">Philosophy</option>
                        <option value="stories">Stories</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="form-control" />
                    </div>
                  </div>
                ) : (
                  <div>
                    {crudSubTab !== 'quotes' && (
                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="form-control" required />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Content Body</label>
                      {crudSubTab === 'quotes' ? (
                        <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className="form-control" placeholder="Quote contents..." required />
                      ) : (
                        <RichTextEditor value={formContent} onChange={setFormContent} placeholder="Content body..." />
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Author Display Name</label>
                        <input type="text" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} className="form-control" />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="form-control">
                          {categories.filter(c => c.type === (crudSubTab === 'articles' ? 'philosophy' : crudSubTab)).map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Language</label>
                        <select value={formLanguage} onChange={(e) => setFormLanguage(e.target.value)} className="form-control">
                          <option value="ta">தமிழ் (Tamil)</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      
                      {crudSubTab === 'articles' || crudSubTab === 'stories' ? (
                        <div className="form-group">
                          <label className="form-label">Reading Time (mins)</label>
                          <input type="number" value={formReadingTime} onChange={(e) => setFormReadingTime(e.target.value)} className="form-control" />
                        </div>
                      ) : null}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tags (comma separated)</label>
                      <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="form-control" placeholder="wisdom, peace" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
                      <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} id="new-feat" />
                      <label htmlFor="new-feat" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Mark as Featured / Quote of the Day</label>
                    </div>
                  </div>
                )}
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '1rem' }}>
                  Create and Approve Publish
                </button>
              </form>
            )}

            {/* READ / TABLE CRUD LOG */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>Fetching table log data...</div>
            ) : crudItems.length > 0 ? (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {crudSubTab === 'users' ? (
                        <>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created At</th>
                          <th>Actions</th>
                        </>
                      ) : crudSubTab === 'categories' ? (
                        <>
                          <th>Name</th>
                          <th>Slug</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </>
                      ) : (
                        <>
                          <th>Featured</th>
                          <th>Title / Excerpt</th>
                          <th>Author</th>
                          <th>Views</th>
                          <th>Language</th>
                          <th>Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {crudItems.map((item) => (
                      <tr key={item.id}>
                        {crudSubTab === 'users' ? (
                          <>
                            <td style={{ fontWeight: 600 }}>{item.username}</td>
                            <td>{item.email}</td>
                            <td>
                              <span className={`status-badge ${item.role === 'admin' ? 'status-approved' : 'status-pending'}`}>
                                {item.role}
                              </span>
                            </td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td>
                              {item.id !== 'admin-id' && (
                                <button className="btn btn-danger" onClick={() => handleDeleteItem(item.id, 'users')} style={{ padding: '0.25rem 0.5rem' }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </>
                        ) : crudSubTab === 'categories' ? (
                          <>
                            <td style={{ fontWeight: 600 }}>{catName || item.name}</td>
                            <td>{item.slug}</td>
                            <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.description}</td>
                            <td>
                              <button className="btn btn-danger" onClick={() => handleDeleteItem(item.id, 'categories')} style={{ padding: '0.25rem 0.5rem' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <button 
                                className="action-icon"
                                onClick={() => handleToggleFeatured(item.id, crudSubTab === 'articles' ? 'philosophy_articles' : crudSubTab, item.featured)}
                                style={{ background: 'transparent', border: 'none', color: item.featured ? 'var(--warning)' : 'var(--text-muted)' }}
                              >
                                <Star size={16} fill={item.featured ? 'currentColor' : 'none'} />
                              </button>
                            </td>
                            <td>
                              <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong>{item.title || 'Quote'}</strong> - {item.content}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.author}</td>
                            <td>{item.views || 0}</td>
                            <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{item.language}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" onClick={() => handleLoadEdit(item, crudSubTab)} style={{ padding: '0.25rem 0.5rem' }}>
                                  <Edit3 size={14} />
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDeleteItem(item.id, crudSubTab)} style={{ padding: '0.25rem 0.5rem' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>No items found in this section database.</p>
            )}
          </div>
        )}

        {/* UPDATE / EDIT MODAL POPUP */}
        {editingItem && (
          <Modal 
            isOpen={isEditModalOpen} 
            onClose={() => { setIsEditModalOpen(false); setEditingItem(null); }}
            title={editType === 'submissions' ? 'Polish User Submission before Approving' : `Modify ${editType.slice(0,-1)} details`}
          >
            <form onSubmit={handleSaveEdit}>
              {editType !== 'quotes' && (
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="form-control" required />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Content Content</label>
                {editType === 'quotes' ? (
                  <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className="form-control" required />
                ) : (
                  <RichTextEditor value={formContent} onChange={setFormContent} />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Author Display Name</label>
                  <input type="text" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} className="form-control" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Category slug</label>
                  <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="form-control" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select value={formLanguage} onChange={(e) => setFormLanguage(e.target.value)} className="form-control">
                    <option value="ta">ta</option>
                    <option value="en">en</option>
                  </select>
                </div>

                {(editType === 'articles' || editType === 'stories' || (editType === 'submissions' && (editingItem.content_type === 'philosophy' || editingItem.content_type === 'stories'))) ? (
                  <div className="form-group">
                    <label className="form-label">Reading Time (mins)</label>
                    <input type="number" value={formReadingTime} onChange={(e) => setFormReadingTime(e.target.value)} className="form-control" />
                  </div>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="form-control" />
              </div>

              {editType !== 'submissions' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
                  <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} id="feat-check" />
                  <label htmlFor="feat-check" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Mark Featured / Quote of the Day</label>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', marginTop: '1.5rem' }}>
                Save Changes & Publish
              </button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
