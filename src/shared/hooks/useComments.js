// ============================================================================
// hooks/useComments.js - Custom hook for comments management (FIXED)
// ============================================================================
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useComments = () => {
  const [comments, setComments] = useState([]);
  const [addingComment, setAddingComment] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // Get current user info from localStorage - FIXED using working modal logic
  const getCurrentUserInfo = () => {
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const userid = localStorage.getItem('userid');
    const firstname = localStorage.getItem('firstname') || '';
    const lastname = localStorage.getItem('lastname') || '';
    const email = localStorage.getItem('usernameoremail') || '';
    const profileImage = localStorage.getItem('profileimageurl');

    //  FIXED: Use same logic as working QuestionCommentsModal
    const fullname = `${firstname} ${lastname}`.trim() || username || 'Current User';

    return {
      id: userid || '1',
      username: username || 'Current User',
      firstname,
      lastname,
      email,
      profileimageurl: profileImage,
      fullname: fullname
    };
  };

  // Fetch comments from API
  const fetchComments = async (questionId) => {
    try {
      console.log(` Fetching comments for question: ${questionId}`);
      
      const response = await fetch(`${API_BASE_URL}/questions/comments?questionid=${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const commentsData = await response.json();
        console.log(' Comments received:', commentsData);
        
        // Handle different response formats
        let processedComments = [];
        
        if (Array.isArray(commentsData)) {
          processedComments = commentsData;
        } else if (commentsData.comments && Array.isArray(commentsData.comments)) {
          processedComments = commentsData.comments;
        } else if (commentsData.data && Array.isArray(commentsData.data)) {
          processedComments = commentsData.data;
        } else {
          processedComments = [];
        }

        // Process comments to ensure proper user info - FIXED to prioritize login name
        const enhancedComments = processedComments.map(comment => ({
          ...comment,
          // 🔧 FIXED: Prioritize actual login username over full name
          displayAuthor: comment.user ? 
            comment.user.username ||                    // Login username (highest priority)
            comment.user.email ||                       // Email (often the login)
            `${comment.user.firstname || ''} ${comment.user.lastname || ''}`.trim() || 
            comment.author || 
            'Unknown User' : 
            comment.username ||                         // Direct username property
            comment.author || 
            'Unknown User'
        }));

        setComments(enhancedComments);
        console.log(' Processed comments:', enhancedComments);
      } else {
        console.warn(' Comments API failed, using empty comments');
        setComments([]);
      }
    } catch (err) {
      console.error(' Error fetching comments:', err);
      setComments([]);
    }
  };

  // Add comment via API - FIXED to match your API format
  const addComment = async (questionId, commentText, currentUser) => {
    if (!commentText.trim() || !questionId) return { success: false, error: 'Invalid input' };

    setAddingComment(true);
    
    // Get current user info if not provided
    const userInfo = currentUser || getCurrentUserInfo();
    
    try {
      console.log(` Adding comment via API:`, {
        questionid: questionId,
        content: commentText,
        userInfo: userInfo
      });

      // FIXED: Based on your API docs, it seems to expect query parameters
      // Let's try both approaches to be safe
      
      // Method 1: Query parameters (as per your API docs)
      const queryParams = new URLSearchParams({
        questionid: questionId,
        content: commentText
      });

      const response = await fetch(`${API_BASE_URL}/questions/comments?${queryParams}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Comment added successfully via query params:', result);
        
        // Refresh comments to get the latest data with proper user info
        await fetchComments(questionId);
        return { success: true, data: result };
      } else {
        // Method 2: JSON body (fallback)
        console.log(' Trying with JSON body...');
        
        const bodyResponse = await fetch(`${API_BASE_URL}/questions/comments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            questionid: questionId,
            content: commentText,
            userid: userInfo.id
          })
        });

        if (bodyResponse.ok) {
          const result = await bodyResponse.json();
          console.log(' Comment added successfully via JSON body:', result);
          
          await fetchComments(questionId);
          return { success: true, data: result };
        } else {
          const errorData = await bodyResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${bodyResponse.status}: ${bodyResponse.statusText}`);
        }
      }
    } catch (err) {
      console.error(' Error adding comment:', err);
      
      // Fallback: Add comment to local state with proper user info
      const newComment = {
        id: Date.now(),
        content: commentText,
        author: userInfo.username,
        username: userInfo.username,
        displayAuthor: userInfo.fullname || userInfo.username,
        timecreated: Math.floor(Date.now() / 1000),
        userid: userInfo.id,
        user: {
          id: userInfo.id,
          firstname: userInfo.firstname,
          lastname: userInfo.lastname,
          username: userInfo.username,
          email: userInfo.email,
          profileimageurl: userInfo.profileimageurl
        }
      };
      
      console.log('Adding fallback comment with user info:', newComment);
      setComments(prev => [...prev, newComment]);
      return { success: false, error: err.message, localComment: newComment };
    } finally {
      setAddingComment(false);
    }
  };

  // Delete comment - FIXED to match your API format
  const deleteComment = async (commentId, questionId) => {
    try {
      console.log(` Deleting comment ${commentId} for question ${questionId}`);
      
      // Based on your API docs: query parameters for questionid and commentid
      const queryParams = new URLSearchParams({
        questionid: questionId,
        commentid: commentId
      });

      const response = await fetch(`${API_BASE_URL}/questions/comments?${queryParams}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        console.log(' Comment deleted successfully');
        await fetchComments(questionId);
        return { success: true };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(' Error deleting comment:', err);
      return { success: false, error: err.message };
    }
  };

  // Update comment (if needed)
  const updateComment = async (commentId, newContent, questionId) => {
    try {
      const queryParams = new URLSearchParams({
        questionid: questionId,
        commentid: commentId,
        content: newContent
      });

      const response = await fetch(`${API_BASE_URL}/questions/comments?${queryParams}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchComments(questionId);
        return { success: true };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(' Error updating comment:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    comments,
    addingComment,
    addComment,
    fetchComments,
    deleteComment,
    updateComment,
    setComments
  };
};