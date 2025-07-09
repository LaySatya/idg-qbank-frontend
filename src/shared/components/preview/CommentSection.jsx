// ============================================================================
// FIXED: CommentSection.jsx - Correct User Token Handling and Optimistic UI
// ============================================================================
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export const CommentSection = ({
  comments,
  setComments,
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
    if (!currentUser) {
      const token = localStorage.getItem('token');
      if (!token) return 'Guest';
      const firstname = localStorage.getItem('firstname') || '';
      const lastname = localStorage.getItem('lastname') || '';
      const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail') || '';
      return `${firstname} ${lastname}`.trim() || username || 'Current User';
    }
    const firstname = currentUser.firstname || '';
    const lastname = currentUser.lastname || '';
    return `${firstname} ${lastname}`.trim() || currentUser.username || 'Current User';
  };

//   const handleAddComment = async () => {
//     if (!commentText.trim()) {
//       return toast.error('Please enter a comment');
//     }
//     const token = localStorage.getItem('token');
//     if (!token) {
//       toast.error('Please log in to add comments');
//       return;
//     }
//     const userInfo = currentUser || {
//       id: localStorage.getItem('userid'),
//       username: localStorage.getItem('username') || localStorage.getItem('usernameoremail'),
//       firstname: localStorage.getItem('firstname') || '',
//       lastname: localStorage.getItem('lastname') || '',
//       email: localStorage.getItem('email') || localStorage.getItem('usernameoremail') || ''
//     };

//     // Optimistic UI update
//     const optimisticComment = {
//       id: Date.now(),
//       content: commentText.trim(),
//       author: userInfo.firstname || userInfo.lastname ? `${userInfo.firstname} ${userInfo.lastname}`.trim() : userInfo.username || 'Current User',
//       username: userInfo.username || 'Current User',
//       timecreated: Math.floor(Date.now() / 1000),
//       userid: userInfo.id || 1,
//       user: {
//         id: userInfo.id || 1,
//         firstname: userInfo.firstname || '',
//         lastname: userInfo.lastname || '',
//         email: userInfo.username || ''
//       }
//     };
//     setComments(prev => [optimisticComment, ...prev]);

//     setCommentText('');
//     try {
//       const result = await onAddComment(questionId, commentText, userInfo);
//       if (!result.success) {
//         throw new Error(result.error || 'Failed to add comment');
//       }
//       toast.success('Comment added successfully!');
//     } catch (error) {
//       toast.error(error.message || 'Failed to add comment');
//       // Optionally rollback optimistic update here if needed
//     }
//   };
const handleAddComment = async () => {
  if (!commentText.trim()) {
    return toast.error('Please enter a comment');
  }
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('Please log in to add comments');
    return;
  }

  // Optimistic UI update
  const userInfo = currentUser || {
    id: localStorage.getItem('userid'),
    username: localStorage.getItem('username') || localStorage.getItem('usernameoremail'),
    firstname: localStorage.getItem('firstname') || '',
    lastname: localStorage.getItem('lastname') || '',
    email: localStorage.getItem('email') || localStorage.getItem('usernameoremail') || ''
  };

  const optimisticComment = {
    id: Date.now(),
    content: commentText.trim(),
    author: userInfo.firstname || userInfo.lastname ? `${userInfo.firstname} ${userInfo.lastname}`.trim() : userInfo.username || 'Current User',
    username: userInfo.username || 'Current User',
    timecreated: Math.floor(Date.now() / 1000),
    userid: userInfo.id || 1,
    user: {
      id: userInfo.id || 1,
      firstname: userInfo.firstname || '',
      lastname: userInfo.lastname || '',
      email: userInfo.username || ''
    }
  };
  setComments(prev => [optimisticComment, ...prev]);

  setCommentText('');
  try {
    // Only send questionId and commentText to onAddComment
    const result = await onAddComment(questionId, commentText);
    if (!result.success) {
      throw new Error(result.error || 'Failed to add comment');
    }
    toast.success('Comment added successfully!');
  } catch (error) {
    toast.error(error.message || 'Failed to add comment');
    // Optionally rollback optimistic update here if needed
  }
};
  const canDeleteComment = (comment) => {
    const currentUserId = currentUser?.id || localStorage.getItem('userid');
    return currentUserId && (currentUserId == comment.userid || currentUserId == comment.user?.id);
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
                      <img 
                        src={profileImg} 
                        alt="avatar" 
                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: 32, 
                      height: 32,
                      backgroundColor: '#007bff',
                      color: '#fff', 
                      display: profileImg ? 'none' : 'flex',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '50%', 
                      fontWeight: 'bold'
                    }}>
                      {getInitials(displayName)}
                    </div>
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
              style={{ 
                width: '100%', 
                minHeight: 80, 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                resize: 'vertical'
              }}
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
                  backgroundColor: addingComment || !commentText.trim() ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: addingComment || !commentText.trim() ? 'not-allowed' : 'pointer'
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