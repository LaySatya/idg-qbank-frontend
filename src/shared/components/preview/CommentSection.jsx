import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export const CommentSection = ({
  comments,
  currentUser,
  addingComment,
  onAddComment,
  showComments,
  setShowComments,
  questionId
}) => {
  const [commentText, setCommentText] = useState('');

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp * 1000);
      const now = new Date();
      const diffMs = now - date;
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getAuthorName = (comment) => {
    const user = comment.user || {};
    const firstname = user.firstname || '';
    const lastname = user.lastname || '';
    return `${firstname} ${lastname}`.trim() || comment.username || 'Unknown User';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const getCurrentUserDisplayName = () => {
    if (!currentUser) return 'Guest';
    const firstname = currentUser.firstname || localStorage.getItem('firstname') || '';
    const lastname = currentUser.lastname || localStorage.getItem('lastname') || '';
    return `${firstname} ${lastname}`.trim() || 'Current User';
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return toast.error('Please enter a comment');
    const result = await onAddComment(questionId, commentText, currentUser);
    if (result.success) {
      toast.success('Comment added!');
      setCommentText('');
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
  };

  const canDeleteComment = (comment) => {
    return currentUser?.id === comment.userid;
  };

  return (
    <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '6px' }}>
      <button
        onClick={() => setShowComments(!showComments)}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: '#f8f9fa',
          border: 'none',
          borderBottom: showComments ? '1px solid #dee2e6' : 'none',
          borderRadius: showComments ? '6px 6px 0 0' : '6px',
          fontWeight: 'bold',
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        {showComments ? '▼' : '▶'} Comments ({comments.length})
      </button>

      {showComments && (
        <div style={{ padding: '16px' }}>
          {comments.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#888' }}>No comments yet</div>
          ) : (
            comments.map((comment, index) => {
              const displayName = getAuthorName(comment);
              const user = comment.user || {};
              const profileImg = user.profileimageurl;
              return (
                <div key={comment.id} style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {profileImg ? (
                      <img src={profileImg} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    ) : (
                      <div style={{
                        width: 32, height: 32,
                        backgroundColor: '#007bff',
                        color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', fontWeight: 'bold'
                      }}>
                        {getInitials(displayName)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{displayName}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{formatDate(comment.timecreated)}</div>
                    </div>
                    {canDeleteComment(comment) && (
                      <button
                        onClick={() => toast('TODO: delete comment')}
                        style={{
                          marginLeft: 'auto',
                          background: 'transparent',
                          color: '#dc3545',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <div style={{ marginLeft: '42px', marginTop: '6px' }}>{comment.content}</div>
                </div>
              );
            })
          )}

          <div>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              Commenting as <strong>{getCurrentUserDisplayName()}</strong>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              style={{ width: '100%', minHeight: 80, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              disabled={addingComment}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <small>Press Ctrl + Enter to submit</small>
              <button
                onClick={handleAddComment}
                disabled={addingComment || !commentText.trim()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: addingComment ? 'not-allowed' : 'pointer'
                }}
              >
                {addingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
