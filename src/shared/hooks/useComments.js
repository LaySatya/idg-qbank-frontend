// ============================================================================
// FIXED: useComments.js - Proper API Authentication
// ============================================================================
import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useComments = () => {
  const [comments, setComments] = useState([]);
  const [addingComment, setAddingComment] = useState(false);

  //  FIXED: Enhanced auth headers with better error handling
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(' No authentication token found');
      throw new Error('Authentication required - please log in again');
    }
    
    console.log(' Using auth token:', token.substring(0, 20) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  //  FIXED: Get current user info with validation
  const getCurrentUserInfo = () => {
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const userid = localStorage.getItem('userid');
    const firstname = localStorage.getItem('firstname') || '';
    const lastname = localStorage.getItem('lastname') || '';
    const email = localStorage.getItem('email') || localStorage.getItem('usernameoremail') || '';
    const profileImage = localStorage.getItem('profileimageurl');

    if (!userid || !username) {
      console.warn(' Incomplete user info in localStorage:', {
        userid, username, firstname, lastname
      });
    }

    const fullname = `${firstname} ${lastname}`.trim() || username || 'Current User';

    const userInfo = {
      id: userid || '1',
      username: username || 'Current User',
      firstname,
      lastname,
      email,
      profileimageurl: profileImage,
      fullname: fullname
    };

    console.log('Current user info:', userInfo);
    return userInfo;
  };

  // Fetch comments from API
  const fetchComments = async (questionId) => {
    try {
      console.log(` Fetching comments for question: ${questionId}`);
      
      const response = await fetch(`${API_BASE_URL}/questions/comments?questionid=${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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

      // Process comments to ensure proper user info
      const enhancedComments = processedComments.map(comment => ({
        ...comment,
        displayAuthor: comment.user ? 
          comment.user.username ||
          comment.user.email ||
          `${comment.user.firstname || ''} ${comment.user.lastname || ''}`.trim() || 
          comment.author || 
          'Unknown User' : 
          comment.username ||
          comment.author || 
          'Unknown User'
      }));

      setComments(enhancedComments);
      console.log('Processed comments:', enhancedComments);
      
    } catch (err) {
      console.error(' Error fetching comments:', err);
      setComments([]);
    }
  };

  //  FIXED: Add comment with proper authentication and user info
  const addComment = async (questionId, commentText, currentUser) => {
    if (!commentText.trim() || !questionId) {
      return { success: false, error: 'Invalid input' };
    }

    setAddingComment(true);
    
    // Get current user info if not provided
    const userInfo = currentUser || getCurrentUserInfo();
    
    try {
      console.log(` Adding comment via API:`, {
        questionid: questionId,
        content: commentText,
        userInfo: userInfo
      });

      //  FIXED: Use query parameters as per your API docs
      const queryParams = new URLSearchParams({
        questionid: questionId,
        content: commentText
      });

      const response = await fetch(`${API_BASE_URL}/questions/comments?${queryParams}`, {
        method: 'POST',
        headers: getAuthHeaders()
        // No body needed since we're using query parameters
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Comment added successfully:', result);
      
      // Refresh comments to get the latest data with proper user info
      await fetchComments(questionId);
      return { success: true, data: result };

    } catch (err) {
      console.error(' Error adding comment:', err);
      
      //  IMPROVED: Better fallback with user info
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
      
      console.log(' Adding fallback comment with user info:', newComment);
      setComments(prev => [...prev, newComment]);
      
      return { 
        success: false, 
        error: err.message, 
        localComment: newComment,
        message: 'Comment added locally (API failed)'
      };
    } finally {
      setAddingComment(false);
    }
  };

  return {
    comments,
    addingComment,
    addComment,
    fetchComments,
    setComments
  };
};
