import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-hot-toast';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QuestionCommentsModal = ({ isOpen, onRequestClose, question, setQuestions }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Get current user info
  useEffect(() => {
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const userid = localStorage.getItem('userid');
    const firstname = localStorage.getItem('firstname') || '';
    const lastname = localStorage.getItem('lastname') || '';
    const profileimageurl = localStorage.getItem('profileimageurl');
    
    console.log('📱 Setting current user:', { username, userid, firstname, lastname, profileimageurl });
    
    setCurrentUser({
      id: userid,
      username: username,
      fullname: `${firstname} ${lastname}`.trim() || username || 'Current User',
      firstname,
      lastname,
      profileimageurl: profileimageurl || undefined // Ensure it's undefined if null/empty
    });
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      console.log(` Fetching comments for question ${question.id}...`);
      
      const res = await fetch(`${API_BASE_URL}/questions/comments?questionid=${question.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log(' Comments response:', data);
      
      // Handle different response formats
      let commentsList = [];
      if (Array.isArray(data)) {
        commentsList = data;
      } else if (data.comments && Array.isArray(data.comments)) {
        commentsList = data.comments;
      } else if (data.data && Array.isArray(data.data)) {
        commentsList = data.data;
      }
      
      // Sort comments by creation time (newest first)
      commentsList.sort((a, b) => (b.timecreated || 0) - (a.timecreated || 0));
      
      setComments(commentsList);
      console.log(` Loaded ${commentsList.length} comments`);
      
    } catch (error) {
      console.error(' Failed to load comments:', error);
      toast.error('Failed to load comments: ' + error.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && question?.id) {
      fetchComments();
    }
  }, [isOpen, question?.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    let apiCallSucceeded = false;
    
    try {
      console.log(` Adding comment for question ${question.id}:`, newComment);
      
      // Method 1: Using request body (preferred)
      const res = await fetch(`${API_BASE_URL}/questions/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          questionid: question.id,
          content: newComment.trim(),
          userid: currentUser?.id || 1
        })
      });

      if (!res.ok) {
        // Fallback: Try URL parameters method
        console.log(' Trying alternative API format...');
        
        const fallbackUrl = `${API_BASE_URL}/questions/comments?questionid=${question.id}&content=${encodeURIComponent(newComment.trim())}`;
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        
        if (!fallbackRes.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const fallbackData = await fallbackRes.json();
        console.log(' Comment added via fallback method:', fallbackData);
      } else {
        const data = await res.json();
        console.log(' Comment added successfully:', data);
      }

      // Mark API call as successful
      apiCallSucceeded = true;
      
    } catch (error) {
      console.error(' Failed to add comment:', error);
      apiCallSucceeded = false;
    }

    // Handle success or failure outside of try-catch to prevent duplicate toasts
    if (apiCallSucceeded) {
      // API succeeded - use optimistic update and show success toast
      const newOptimisticComment = {
        id: Date.now(),
        content: newComment.trim(),
        author: currentUser?.fullname || currentUser?.username || 'Current User',
        username: currentUser?.username || 'Current User',
        timecreated: Math.floor(Date.now() / 1000),
        userid: currentUser?.id || 1,
        user: {
          id: currentUser?.id || 1,
          firstname: currentUser?.firstname || '',
          lastname: currentUser?.lastname || '',
          email: currentUser?.username || '',
          profileimageurl: (currentUser?.profileimageurl && 
                           currentUser.profileimageurl !== 'null' && 
                           currentUser.profileimageurl !== 'undefined' && 
                           currentUser.profileimageurl.trim() !== '') 
                           ? currentUser.profileimageurl : undefined
        }
      };
      
      setComments(prev => [newOptimisticComment, ...prev]);
      setNewComment('');
      
      // Update the questions data to reflect the new comment count
      if (setQuestions) {
        setQuestions(prev => {
          if (!Array.isArray(prev)) return prev;
          
          return prev.map(q => 
            q.id === question.id 
              ? { ...q, comments: (q.comments || 0) + 1 }
              : q
          );
        });
      }
      
      toast.success('Comment added successfully!');
      
    } else {
      // API failed - use optimistic update and show fallback toast
      const optimisticComment = {
        id: Date.now(),
        content: newComment.trim(),
        author: currentUser?.fullname || currentUser?.username || 'Current User',
        username: currentUser?.username || 'Current User',
        timecreated: Math.floor(Date.now() / 1000),
        userid: currentUser?.id || 1,
        user: {
          id: currentUser?.id || 1,
          firstname: currentUser?.firstname || '',
          lastname: currentUser?.lastname || '',
          email: currentUser?.username || '',
          profileimageurl: (currentUser?.profileimageurl && 
                           currentUser.profileimageurl !== 'null' && 
                           currentUser.profileimageurl !== 'undefined' && 
                           currentUser.profileimageurl.trim() !== '') 
                           ? currentUser.profileimageurl : undefined
        }
      };
      
      setComments(prev => [optimisticComment, ...prev]);
      setNewComment('');
      
      // Update the questions data to reflect the new comment count (optimistic)
      if (setQuestions) {
        setQuestions(prev => {
          if (!Array.isArray(prev)) return prev;
          
          return prev.map(q => 
            q.id === question.id 
              ? { ...q, comments: (q.comments || 0) + 1 }
              : q
          );
        });
      }
      
      toast.success('Comment added locally (API unavailable)');
    }
    
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setDeleting(true);
    
    // Store original comments for rollback
    const originalComments = [...comments];
    
    // Optimistically remove comment immediately for better UX
    setComments(prev => prev.filter(c => c.id !== commentToDelete));

    try {
      console.log(` Deleting comment ${commentToDelete} for question ${question.id}...`);
      
      const url = `${API_BASE_URL}/questions/comments?questionid=${question.id}&commentid=${commentToDelete}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        // Log the exact error for debugging
        const errorText = await res.text();
        console.error(` Delete API Error: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log(' Comment deleted successfully:', data);

      if (data.success !== false) {
        // Success! Comment already removed optimistically
        
        // Update the questions data to reflect the decreased comment count
        if (setQuestions) {
          setQuestions(prev => {
            if (!Array.isArray(prev)) return prev;
            
            return prev.map(q => 
              q.id === question.id 
                ? { ...q, comments: Math.max((q.comments || 0) - 1, 0) }
                : q
            );
          });
        }
        
        toast.success('Comment deleted successfully!');
      } else {
        // API returned success: false
        console.warn(' API returned success: false', data);
        throw new Error(data.message || 'API returned unsuccessful response');
      }

    } catch (error) {
      console.error(' Failed to delete comment:', error);
      
      // Rollback: Restore the original comments
      setComments(originalComments);
      
      // Show specific error message
      if (error.message.includes('401')) {
        toast.error('Unauthorized: Please log in again');
      } else if (error.message.includes('404')) {
        toast.error('Comment not found or already deleted');
      } else if (error.message.includes('403')) {
        toast.error('You don\'t have permission to delete this comment');
      } else {
        toast.error(`Failed to delete comment: ${error.message}`);
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown date';
      const date = new Date(timestamp * 1000);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getAuthorName = (comment) => {
    if (comment.user?.firstname && comment.user?.lastname) {
      return `${comment.user.firstname} ${comment.user.lastname}`.trim();
    }
    return comment.author || comment.username || 'Unknown User';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

   return (
    <>
<Dialog 
  open={isOpen} 
  onClose={onRequestClose} 
  maxWidth={false}
  PaperProps={{
    sx: {
      borderRadius: 3,
      boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
      width: 520,
      minWidth: 520,
      maxWidth: 520,
      height: 600,
      minHeight: 600,
      maxHeight: 600,
      margin: 'auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }
  }}
  sx={{
    '& .MuiDialog-container': {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '5vh'
    }
  }}
>
  {/* Header */}
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    p: 2,
    borderBottom: '1px solid #e5e7eb',
    bgcolor: '#f8fafc'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CommentIcon sx={{ color: '#64748b', fontSize: 22 }} />
      <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#334155', margin: 0 }}>
        Comments for Question #{question?.id}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={`${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
        sx={{
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 12,
          background: '#f3f4f6',
          color: '#64748b',
          fontWeight: 500,
          height: 24
        }}
      />
      <IconButton
        onClick={onRequestClose}
        sx={{ 
          p: 0.5,
          color: '#64748b',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
        }}
      >
        <span style={{ fontSize: 18 }}>×</span>
      </IconButton>
    </Box>
  </Box>

  {/* Content */}
  <Box sx={{
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
    {/* Comments List - scrollable content */}
    <Box sx={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      p: 3,
      background: '#fff'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
          <Typography sx={{ ml: 2, alignSelf: 'center' }}>Loading comments...</Typography>
        </Box>
      ) : comments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <CommentIcon sx={{ fontSize: 40, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" gutterBottom>No comments yet</Typography>
          <Typography variant="body2">Be the first to add a comment!</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {comments.map((comment, index) => (
            <Box key={comment.id || index}>
              <Box sx={{
                display: 'flex',
                gap: 1.5,
                p: 1.5,
                backgroundColor: '#fff',
                borderRadius: 2,
                border: '1px solid #e9ecef',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                '&:hover': {
                  backgroundColor: '#f5f6fa',
                  borderColor: '#d1ecf1'
                }
              }}>
                {(() => {
                  // Use the same approach as Header.jsx - prioritize localStorage
                  const getProfileImageUrl = (imageUrl) => {
                    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl.trim() === '') {
                      return null;
                    }
                    
                    // If it's a Moodle URL and doesn't have token, add it
                    if (imageUrl.includes('moodle') || imageUrl.includes('pluginfile.php')) {
                      const token = localStorage.getItem('token');
                      if (token && !imageUrl.includes('token=')) {
                        const separator = imageUrl.includes('?') ? '&' : '?';
                        return `${imageUrl}${separator}token=${token}`;
                      }
                    }
                    
                    return imageUrl;
                  };

                  // For current user, use localStorage first (like Header.jsx)
                  let profileImageUrl;
                  if (currentUser?.id == comment.userid || currentUser?.username === comment.username) {
                    // This is the current user's comment - use localStorage like Header
                    profileImageUrl = localStorage.getItem('profileimageurl') || getProfileImageUrl(comment.user?.profileimageurl);
                  } else {
                    // This is another user's comment - process their URL with token
                    profileImageUrl = getProfileImageUrl(comment.user?.profileimageurl);
                  }
                  
                  console.log('🖼️ Profile image URL for comment:', {
                    isCurrentUser: currentUser?.id == comment.userid,
                    original: comment.user?.profileimageurl,
                    fromLocalStorage: localStorage.getItem('profileimageurl'),
                    processed: profileImageUrl
                  });
                  
                  return profileImageUrl ? (
                    <Avatar 
                      src={profileImageUrl}
                      alt={getAuthorName(comment)}
                      sx={{ width: 32, height: 32 }}
                      onError={(e) => { 
                        console.log(' Comment avatar failed to load:', {
                          original: comment.user?.profileimageurl,
                          processed: profileImageUrl,
                          error: e.target.src
                        });
                        e.target.style.display = 'none';
                        // Create fallback avatar
                        const fallback = e.target.parentNode;
                        fallback.innerHTML = `
                          <div style="
                            width: 32px; 
                            height: 32px; 
                            border-radius: 50%; 
                            background-color: #1976d2; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            color: white; 
                            font-size: 13px; 
                            font-weight: 600;
                          ">
                            ${getInitials(getAuthorName(comment))}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      width: 32, 
                      height: 32,
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {getInitials(getAuthorName(comment))}
                    </Avatar>
                  );
                })()}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="600">
                      {getAuthorName(comment)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.timecreated)}
                    </Typography>
                    {(currentUser?.id == comment.userid || currentUser?.username === comment.username) && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteComment(comment.id)}
                        sx={{ ml: 'auto', opacity: 0.7, '&:hover': { opacity: 1 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                    color: 'text.primary'
                  }}>
                    {comment.content || comment.text || comment.comment}
                  </Typography>
                </Box>
              </Box>
              
              {index < comments.length - 1 && (
                <Divider sx={{ my: 1, opacity: 0.5 }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>

    {/* Add Comment Section - stays at bottom */}
    <Box sx={{ 
      p: 2, 
      borderTop: '1px solid #e5e7eb', 
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e5e7eb'
    }}>
      {currentUser && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {(() => {
            // Use the same approach as Header.jsx for current user profile image
            const profileImageUrl = localStorage.getItem('profileimageurl') || currentUser.profileimageurl;
            
            console.log(' Current user profile image URL:', {
              fromLocalStorage: localStorage.getItem('profileimageurl'),
              fromCurrentUser: currentUser.profileimageurl,
              final: profileImageUrl
            });
            
            return (
              <Avatar
                src={profileImageUrl}
                alt={currentUser.fullname}
                sx={{
                  bgcolor: 'secondary.main',
                  width: 28,
                  height: 28,
                  fontSize: '12px'
                }}
                onError={(e) => {
                  console.log(' Current user avatar failed to load:', {
                    src: e.target.src,
                    fromLocalStorage: localStorage.getItem('profileimageurl'),
                    fromCurrentUser: currentUser.profileimageurl
                  });
                  e.target.style.display = 'none';
                  // Create fallback avatar
                  const fallback = e.target.parentNode;
                  fallback.innerHTML = `
                    <div style="
                      width: 28px; 
                      height: 28px; 
                      border-radius: 50%; 
                      background-color: #9c27b0; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      color: white; 
                      font-size: 12px; 
                      font-weight: 600;
                    ">
                      ${getInitials(currentUser.fullname)}
                    </div>
                  `;
                }}
              >
                {!profileImageUrl && getInitials(currentUser.fullname)}
              </Avatar>
            );
          })()}
          <Typography variant="body2" color="text.secondary">
            Commenting as: <strong>{currentUser.fullname}</strong>
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          multiline
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add your comment here... (Press Enter to submit)"
          variant="outlined"
          size="small"
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: 1.5
            }
          }}
          disabled={submitting}
        />
        <Button
          variant="contained"
          onClick={handleAddComment}
          disabled={submitting || !newComment.trim()}
          startIcon={submitting ? <CircularProgress size={14} /> : <SendIcon />}
          sx={{
            minWidth: 90,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: '600',
            px: 2.5,
            py: 1,
            bgcolor: '#64748b',
            color: '#fff',
            '&:hover': { bgcolor: '#475569' },
            '&:disabled': { bgcolor: '#cbd5e1', color: '#94a3b8' }
          }}
        >
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
         Tip: Press Enter to submit, Shift+Enter for new line
      </Typography>
    </Box>
  </Box>

  {/* Footer */}
  <Box sx={{ 
    borderTop: '1px solid #e5e7eb',
    p: 1.5,
    bgcolor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
      {question?.name && question.name.length > 50 
        ? `${question.name.substring(0, 50)}...` 
        : question?.name || 'Question Comments'}
    </Typography>
    <Button 
      onClick={onRequestClose}
      sx={{
        px: 2.5,
        py: 1,
        bgcolor: '#e5e7eb',
        color: '#334155',
        borderRadius: 1,
        fontWeight: 500,
        fontSize: 15,
        textTransform: 'none',
        '&:hover': { bgcolor: '#d1d5db' }
      }}
    >
      Close
    </Button>
  </Box>
</Dialog>

{/* Delete Confirmation Modal */}
<Dialog 
  open={showDeleteConfirm} 
  onClose={() => setShowDeleteConfirm(false)}
  maxWidth="xs"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 3,
      boxShadow: '0 4px 24px 0 rgba(30,41,59,0.10)',
      overflow: 'hidden',
    }
  }}
>
  {/* Header */}
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    p: 2,
    borderBottom: '1px solid #e5e7eb',
    bgcolor: '#f8fafc'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <DeleteIcon sx={{ color: '#ef4444', fontSize: 22 }} />
      <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#334155', margin: 0 }}>
        Delete Comment
      </Typography>
    </Box>
    <IconButton
      onClick={() => setShowDeleteConfirm(false)}
      sx={{ 
        p: 0.5,
        color: '#64748b',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
      }}
    >
      

      <span style={{ fontSize: 18 }}>×</span>
    </IconButton>
  </Box>

  {/* Content */}
  <Box sx={{ p: 3 }}>
    <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
      Are you sure you want to delete this comment? This action cannot be undone.
    </Typography>
    <Box sx={{ 
      p: 2, 
      bgcolor: '#fef2f2', 
      borderLeft: '4px solid #f87171', 
      borderRadius: 1.5,
      mb: 2
    }}>
      <Typography variant="body2" sx={{ color: '#b91c1c', fontSize: 13 }}>
        <strong>Warning:</strong> This will permanently remove the comment from the question.
      </Typography>
    </Box>
  </Box>

  {/* Footer */}
  <Box sx={{ 
    borderTop: '1px solid #e5e7eb',
    p: 1.5,
    bgcolor: '#f8fafc',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 1.5
  }}>
    <Button 
      onClick={() => setShowDeleteConfirm(false)}
      disabled={deleting}
      sx={{
        px: 2.5,
        py: 1,
        bgcolor: '#e5e7eb',
        color: '#334155',
        borderRadius: 1,
        fontWeight: 500,
        fontSize: 15,
        textTransform: 'none',
        '&:hover': { bgcolor: '#d1d5db' }
      }}
    >
      Cancel
    </Button>
    <Button 
      onClick={confirmDeleteComment}
      disabled={deleting}
      startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
      sx={{
        px: 2.5,
        py: 1,
        bgcolor: '#ef4444',
        color: '#fff',
        borderRadius: 1,
        fontWeight: 600,
        fontSize: 15,
        textTransform: 'none',
        '&:hover': { bgcolor: '#dc2626' },
        '&:disabled': { bgcolor: '#fca5a5', color: '#fef2f2' }
      }}
    >
      {deleting ? 'Deleting...' : 'Delete Comment'}
    </Button>
  </Box>
</Dialog>
    </>
  );
};

export default QuestionCommentsModal;