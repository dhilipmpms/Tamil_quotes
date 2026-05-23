import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import { CornerDownRight, Flag, Trash2, Send } from 'lucide-react';

const CommentSystem = ({ contentType, contentId }) => {
  const { profile, language, addNotification } = useApp();
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [message, setMessage] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchComments();
  }, [contentType, contentId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true });

      if (data) {
        setComments(data);
        // Fetch profiles of users who commented
        const userIds = [...new Set(data.map(c => c.user_id))];
        if (userIds.length > 0) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*'); // Select all to easily map, or fetch specific
          
          if (profData) {
            const profMap = {};
            profData.forEach(p => { profMap[p.id] = p; });
            setProfiles(profMap);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, parentId = null) => {
    if (e) e.preventDefault();
    if (!profile) {
      addNotification(language === 'ta' ? 'கருத்து தெரிவிக்க முதலில் உள்நுழையவும்.' : 'Please log in to comment.', 'error');
      return;
    }

    const msg = parentId ? replyMessage : message;
    if (!msg.trim()) return;

    try {
      const newComment = {
        user_id: profile.id,
        content_type: contentType,
        content_id: contentId,
        message: msg,
        parent_id: parentId
      };

      const { data, error } = await supabase.from('comments').insert(newComment);
      if (!error) {
        addNotification(language === 'ta' ? 'உங்கள் கருத்து சேர்க்கப்பட்டது.' : 'Comment added.', 'success');
        if (parentId) {
          setReplyMessage('');
          setReplyToId(null);
        } else {
          setMessage('');
        }
        await fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ reported: true })
        .eq('id', commentId);
      
      if (!error) {
        addNotification(
          language === 'ta' 
            ? 'கருத்து புகாரளிக்கப்பட்டது. நிர்வாகி பரிசீலிப்பார்.' 
            : 'Comment reported to moderators.', 
          'warning'
        );
        await fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (!error) {
        addNotification(language === 'ta' ? 'கருத்து நீக்கப்பட்டது.' : 'Comment deleted.', 'success');
        await fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group comments into root comments and replies
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  const renderComment = (comment, isReply = false) => {
    const author = profiles[comment.user_id] || {
      username: 'Anonymous',
      profile_image: `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user_id}`
    };

    return (
      <div key={comment.id} className={`comment-card ${isReply ? 'reply-indent' : ''}`}>
        <div className="comment-header">
          <div className="comment-author-info">
            <img src={author.profile_image} alt={author.username} className="comment-avatar" />
            <div>
              <span className="comment-author-name">{author.username}</span>
              {author.role === 'admin' && (
                <span style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--accent-primary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  marginLeft: '0.5rem',
                  fontWeight: 700
                }}>Admin</span>
              )}
            </div>
          </div>
          <span className="comment-date">
            {new Date(comment.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        <div className="comment-body">
          <p>{comment.message}</p>
        </div>

        <div className="comment-actions">
          {/* Reply Action */}
          {!isReply && profile && (
            <span className="comment-reply-trigger" onClick={() => setReplyToId(comment.id)}>
              Reply
            </span>
          )}

          {/* Report Action */}
          {profile && profile.id !== comment.user_id && (
            <span 
              className="comment-reply-trigger" 
              onClick={() => handleReportComment(comment.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Flag size={12} /> {language === 'ta' ? 'புகாரளி' : 'Report'}
            </span>
          )}

          {/* Delete Action (Self or Admin) */}
          {profile && (profile.id === comment.user_id || profile.role === 'admin') && (
            <span 
              className="comment-reply-trigger" 
              onClick={() => handleDeleteComment(comment.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--error)' }}
            >
              <Trash2 size={12} /> {language === 'ta' ? 'நீக்கு' : 'Delete'}
            </span>
          )}
        </div>

        {/* Reply Form */}
        {replyToId === comment.id && (
          <form 
            onSubmit={(e) => handleAddComment(e, comment.id)}
            style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}
          >
            <input
              type="text"
              placeholder={language === 'ta' ? 'பதிலைப் பதிவிடவும்...' : 'Write your reply...'}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <Send size={14} />
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setReplyToId(null)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="comments-section">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        {language === 'ta' ? `கருத்துக்கள் (${comments.length})` : `Comments (${comments.length})`}
      </h3>

      {/* Main Comment Posting Form */}
      {profile ? (
        <form onSubmit={(e) => handleAddComment(e, null)} style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <img 
              src={profile.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`} 
              alt={profile.username} 
              style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
            />
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                placeholder={language === 'ta' ? 'உங்கள் கருத்தைப் பதிவிடவும்...' : 'Add to the conversation...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-control"
                style={{ minHeight: '80px', padding: '0.75rem' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', padding: '0.5rem 1.25rem' }}
              >
                {language === 'ta' ? 'கருத்துரை' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {language === 'ta' 
              ? 'கருத்துக்களை எழுத மற்றும் பதிலளிக்க தயவுசெய்து உள்நுழையவும்.' 
              : 'Please log in to write comments and replies.'}
          </p>
        </div>
      )}

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {rootComments.length > 0 ? (
          rootComments.map(comment => (
            <React.Fragment key={comment.id}>
              {renderComment(comment, false)}
              {getReplies(comment.id).map(reply => renderComment(reply, true))}
            </React.Fragment>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            {language === 'ta' ? 'கருத்துக்கள் ஏதும் இல்லை. முதலில் உங்களுடையதை எழுதுங்கள்!' : 'No comments yet. Be the first to comment!'}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;
