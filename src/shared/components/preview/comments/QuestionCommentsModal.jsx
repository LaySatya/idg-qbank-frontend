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

  // Get current user info
  useEffect(() => {
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const userid = localStorage.getItem('userid');
    const firstname = localStorage.getItem('firstname') || '';
    const lastname = localStorage.getItem('lastname') || '';
    const profileimageurl = localStorage.getItem('profileimageurl'); 
    
    setCurrentUser({
      id: userid,
      username: username,
      fullname: `${firstname} ${lastname}`.trim() || username || 'Current User',
      firstname,
      lastname,
      profileimageurl 
      
      

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

      // Clear input and refresh comments
      setNewComment('');
      await fetchComments();
      toast.success(' Comment added successfully!');
      
    } catch (error) {
      console.error(' Failed to add comment:', error);
      
      // Optimistic update as fallback
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
          email: currentUser?.username || ''
        }
      };
      
      setComments(prev => [optimisticComment, ...prev]);
      setNewComment('');
      toast.success(' Comment added locally (API unavailable)');
      
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(' Are you sure you want to delete this comment?')) return;

    // Store original comments for rollback
    const originalComments = [...comments];
    
    // Optimistically remove comment immediately for better UX
    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      console.log(` Deleting comment ${commentId} for question ${question.id}...`);
      
      const url = `${API_BASE_URL}/questions/comments?questionid=${question.id}&commentid=${commentId}`;
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
        toast.success(' Comment deleted successfully!');
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
        toast.error(' Unauthorized: Please log in again');
      } else if (error.message.includes('404')) {
        toast.error(' Comment not found or already deleted');
      } else if (error.message.includes('403')) {
        toast.error(' You don\'t have permission to delete this comment');
      } else {
        toast.error(` Failed to delete comment: ${error.message}`);
      }
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
<Dialog 
  open={isOpen} 
  onClose={onRequestClose} 
  maxWidth={false}
  PaperProps={{
    sx: {
      borderRadius: 3,
      boxShadow: '0 10px 40px rgba(0,0,0,0.10)',
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
  <DialogTitle 
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      py: 2,
      px: 3,
      borderBottom: '1px solid #e9ecef',
      background: '#f7f8fa'
    }}
  >
    <CommentIcon sx={{ fontSize: 24 }} />
    <Box>
      <Typography variant="h6" fontWeight="600">
        Comments for Question #{question?.id}
      </Typography>
      {/* <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
        {question?.name || 'Untitled Question'}
      </Typography> */}
    </Box>
  </DialogTitle>

  <DialogContent
    sx={{
      p: 0,
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0 // allow flex children to shrink
    }}
  >
    {/* Info Header */}
    <Box sx={{ p: 2, backgroundColor: '#f7f8fa', borderBottom: '1px solid #e9ecef' }}>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {/* <Chip
          icon={<PersonIcon />}
          label={`Created by: ${question?.createdBy?.name || 'Unknown'}`}
          variant="outlined"
          size="small"
          sx={{ backgroundColor: 'white' }}
        />
        <Chip
          icon={<AccessTimeIcon />}
          label={`Modified by: ${question?.modifiedBy?.name || 'Unknown'}`}
          variant="outlined"
          size="small"
          sx={{ backgroundColor: 'white' }}
        /> */}
        <Chip
          label={`${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
          color="primary"
          size="small"
        />
      </Box>
    </Box>

    {/* Comments List - take all available space, scroll if needed */}
    <Box sx={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      p: 2,
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
                {comment.user?.profileimageurl ? (
                  <Avatar 
                    src={comment.user.profileimageurl}
                    alt={getAuthorName(comment)}
                    sx={{ width: 32, height: 32 }}
                    onError={(e) => { e.target.src = ''; }}
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
                )}

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

    {/* Add Comment Section - stays at bottom, never scrolls */}
    <Box sx={{ p: 2, borderTop: '1px solid #e9ecef', backgroundColor: '#f7f8fa' }}>
      {currentUser && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar
            src={currentUser.profileimageurl || undefined}
            alt={currentUser.fullname}
            sx={{
              bgcolor: 'secondary.main',
              width: 28,
              height: 28,
              fontSize: '12px'
            }}
          >
            {!currentUser.profileimageurl && getInitials(currentUser.fullname)}
          </Avatar>
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
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: 2
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
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: '600'
          }}
        >
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
         Tip: Press Enter to submit, Shift+Enter for new line
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions sx={{ p: 2, backgroundColor: '#f7f8fa' }}>
    <Button 
      onClick={onRequestClose}
      variant="outlined"
      sx={{ 
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: '600'
      }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>
  );
};

export default QuestionCommentsModal;