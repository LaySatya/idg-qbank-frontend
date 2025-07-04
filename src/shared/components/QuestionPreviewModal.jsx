// ============================================================================
// QuestionPreviewModal.jsx - Complete Moodle Question Preview with Full API Integration
// ============================================================================
import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-hot-toast';
import { questionAPI } from '../../api/questionAPI';
import { userAPI } from '../../api/userapi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function QuestionPreviewModal({ 
  isOpen, 
  onRequestClose, 
  question,
  onEdit,
  onDuplicate,
  onDelete 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [comments, setComments] = useState([]);
  const [technicalInfo, setTechnicalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [previewSettings, setPreviewSettings] = useState({
    questionVersion: 'latest',
    behavior: 'deferred',
    markedOutOf: 1,
    showCorrect: 'shown',
    marks: 'show_mark_and_max',
    decimalPlaces: 2,
    specificFeedback: 'shown',
    generalFeedback: 'shown',
    rightAnswer: 'shown',
    responseHistory: 'not_shown'
  });

  // Get current user info and fetch preview data when modal opens
  useEffect(() => {
    if (isOpen && question?.id) {
      getCurrentUserInfo();
      fetchPreviewData(question.id);
      fetchComments(question.id);
    }
  }, [isOpen, question?.id]);

  // Get current user information
  const getCurrentUserInfo = () => {
    try {
      // Try to get user info from localStorage (saved during login)
      const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
      const userid = localStorage.getItem('userid');
      const profileImage = localStorage.getItem('profileimageurl');
      
      console.log(' Current user info from localStorage:', {
        username,
        userid,
        profileImage
      });

      if (username && userid) {
        setCurrentUser({
          id: userid,
          username: username,
          profileimageurl: profileImage
        });
      } else {
        // Fallback: Try to get users and find current user
        fetchCurrentUserFromAPI();
      }
    } catch (err) {
      console.error(' Error getting current user info:', err);
      // Set fallback user info
      setCurrentUser({
        id: localStorage.getItem('userid') || '1',
        username: 'Current User',
        profileimageurl: null
      });
    }
  };

  // Fetch current user from API if not in localStorage
  const fetchCurrentUserFromAPI = async () => {
    try {
      const users = await userAPI.getUsers();
      const userid = localStorage.getItem('userid');
      const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
      
      if (userid && users) {
        const currentUserData = users.find(user => 
          user.id == userid || user.userid == userid || user.username === username
        );
        
        if (currentUserData) {
          console.log(' Found current user in API:', currentUserData);
          setCurrentUser({
            id: currentUserData.id || currentUserData.userid,
            username: currentUserData.username || currentUserData.usernameoremail || username,
            profileimageurl: currentUserData.profileimageurl
          });
        }
      }
    } catch (err) {
      console.error(' Error fetching current user from API:', err);
    }
  };

  // Fetch preview data from your API
  const fetchPreviewData = async (questionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log(' Fetching preview data from API for question:', questionId);

      // Try to fetch from your preview endpoint
      const response = await fetch(`${API_BASE_URL}/questions/preview?questionid=${questionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json, text/html, text/xml',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(' Preview response content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          // Handle JSON response (like your Postman result)
          const jsonData = await response.json();
          console.log(' Received JSON preview data:', jsonData);
          
          if (jsonData.html) {
            // Handle HTML preview format from your API
            parseHTMLPreviewData(jsonData.html, questionId);
          } else {
            // Handle standard JSON format
            processAPIPreviewData(jsonData, questionId);
          }
        } else if (contentType && contentType.includes('text/xml')) {
          // Handle XML response
          const xmlText = await response.text();
          console.log(' Received XML preview data, length:', xmlText.length);
          parseXMLPreviewData(xmlText, questionId);
        } else {
          // Handle HTML or other text responses
          const textContent = await response.text();
          console.log(' Received HTML/text preview data, length:', textContent.length);
          parseHTMLPreviewData(textContent, questionId);
        }
      } else {
        console.warn(' Preview API failed, using fallback data');
        // Fallback to existing question data
        const fallbackData = createMoodlePreviewData(question);
        setPreviewData(fallbackData);
        setTechnicalInfo(createFallbackTechnicalInfo(question));
      }

    } catch (err) {
      console.error(' Error fetching preview data:', err);
      setError(err.message);
      
      // Fallback to existing question data
      const fallbackData = createMoodlePreviewData(question);
      setPreviewData(fallbackData);
      setTechnicalInfo(createFallbackTechnicalInfo(question));
    } finally {
      setLoading(false);
    }
  };

  // NEW: Parse HTML preview data from your API
  const parseHTMLPreviewData = (htmlContent, questionId) => {
    try {
      console.log(' Parsing HTML preview data...');
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Extract information from the HTML structure
      const questionDetails = tempDiv.querySelector('.question-details');
      const questionText = tempDiv.querySelector('.question-text');
      const questionTitle = tempDiv.querySelector('h3');
      
      // Extract question type from details
      let qtype = 'unknown';
      if (questionDetails) {
        const typeElement = Array.from(questionDetails.querySelectorAll('p')).find(p => 
          p.textContent.includes('Type:')
        );
        if (typeElement) {
          qtype = typeElement.textContent.replace('Type:', '').trim();
        }
      }
      
      // Extract default mark
      let defaultmark = 1;
      if (questionDetails) {
        const markElement = Array.from(questionDetails.querySelectorAll('p')).find(p => 
          p.textContent.includes('Default Mark:')
        );
        if (markElement) {
          const markText = markElement.textContent.replace('Default Mark:', '').trim();
          defaultmark = parseFloat(markText) || 1;
        }
      }
      
      // Extract creator info
      let createdBy = { name: 'Unknown', date: '' };
      if (questionDetails) {
        const createdElement = Array.from(questionDetails.querySelectorAll('p')).find(p => 
          p.textContent.includes('Created:')
        );
        if (createdElement) {
          const createdText = createdElement.textContent.replace('Created:', '').trim();
          const parts = createdText.split(' by ');
          if (parts.length === 2) {
            createdBy = { name: parts[1], date: parts[0] };
          }
        }
      }
      
      // Extract modifier info
      let modifiedBy = { name: 'Unknown', date: '' };
      if (questionDetails) {
        const modifiedElement = Array.from(questionDetails.querySelectorAll('p')).find(p => 
          p.textContent.includes('Modified:')
        );
        if (modifiedElement) {
          const modifiedText = modifiedElement.textContent.replace('Modified:', '').trim();
          const parts = modifiedText.split(' by ');
          if (parts.length === 2) {
            modifiedBy = { name: parts[1], date: parts[0] };
          }
        }
      }

      const processedData = {
        id: questionId,
        name: questionTitle ? questionTitle.textContent.split('(')[0].trim() : question.name || `Question ${questionId}`,
        questiontext: processHTMLContent(questionText ? questionText.innerHTML : ''),
        qtype: qtype,
        status: question.status || 'ready',
        defaultmark: defaultmark,
        answers: qtype === 'match' ? extractMatchingAnswers(questionText) : extractAnswersFromQuestionData(question),
        generalfeedback: '',
        images: extractImagesFromHTML(questionText ? questionText.innerHTML : ''),
        tags: question.tags || [],
        createdBy: createdBy,
        modifiedBy: modifiedBy,
        htmlPreview: htmlContent // Store original HTML for reference
      };

      console.log(' Parsed HTML preview data:', processedData);
      setPreviewData(processedData);

      // Extract technical information from HTML
      const techInfo = {
        behaviour: 'Deferred feedback',
        minimumFraction: 0,
        maximumFraction: 1,
        questionVariant: 1,
        questionSummary: questionText ? questionText.textContent.substring(0, 100) : '',
        rightAnswerSummary: 'See question content',
        responseSummary: '',
        questionState: 'todo'
      };

      setTechnicalInfo(techInfo);

    } catch (err) {
      console.error(' Error parsing HTML preview:', err);
      // Fallback to question data
      const fallbackData = createMoodlePreviewData(question);
      setPreviewData(fallbackData);
      setTechnicalInfo(createFallbackTechnicalInfo(question));
    }
  };

  // Extract matching question answers (for drag-and-drop/matching questions)
  const extractMatchingAnswers = (questionTextElement) => {
    // For matching questions, we typically don't show individual answers
    // in the same way as multiple choice, so return empty array
    // The question content itself contains the matching pairs
    return [];
  };

  // Fetch comments from API
  const fetchComments = async (questionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log(' Fetching comments for question:', questionId);

      const response = await fetch(`${API_BASE_URL}/questions/comments?questionid=${questionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const commentsData = await response.json();
        console.log(' Received comments:', commentsData);
        
        // Handle different response formats
        if (Array.isArray(commentsData)) {
          setComments(commentsData);
        } else if (commentsData.comments && Array.isArray(commentsData.comments)) {
          setComments(commentsData.comments);
        } else if (commentsData.data && Array.isArray(commentsData.data)) {
          setComments(commentsData.data);
        } else {
          setComments([]);
        }
      } else {
        console.warn(' Comments API failed, using empty comments');
        setComments([]);
      }
    } catch (err) {
      console.error(' Error fetching comments:', err);
      setComments([]);
    }
  };

  // Add comment via API with proper user info and correct parameter names
  const addComment = async (commentText) => {
    if (!commentText.trim() || !question?.id) return;

    setAddingComment(true);
    try {
      const token = localStorage.getItem('token');
      const userid = localStorage.getItem('userid');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      console.log(' Adding comment via API with user info:', {
        questionid: question.id,
        content: commentText, // Changed from 'comment' to 'content'
        userid: userid,
        currentUser: currentUser
      });

      // FIXED: Use 'content' instead of 'comment' to match backend expectation
      const response = await fetch(`${API_BASE_URL}/questions/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionid: question.id,
          content: commentText, // FIXED: Backend expects 'content' not 'comment'
          userid: userid || currentUser?.id || 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(' Comment added successfully:', result);
        
        toast.success('Comment added successfully');
        setCommentText('');
        
        // Refresh comments to get the latest data
        await fetchComments(question.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(' API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(' Error adding comment:', err);
      toast.error(`Failed to add comment: ${err.message}`);
      
      // Fallback: Add comment to local state with proper user info
      const fallbackUser = currentUser || {
        username: localStorage.getItem('username') || localStorage.getItem('usernameoremail') || 'Current User',
        id: localStorage.getItem('userid') || '1',
        firstname: localStorage.getItem('firstname') || '',
        lastname: localStorage.getItem('lastname') || ''
      };

      const newComment = {
        id: Date.now(),
        content: commentText, // Use 'content' to match API format
        author: fallbackUser.username,
        username: fallbackUser.username,
        timecreated: Math.floor(Date.now() / 1000), // Unix timestamp
        userid: fallbackUser.id,
        user: {
          id: fallbackUser.id,
          firstname: fallbackUser.firstname,
          lastname: fallbackUser.lastname,
          email: localStorage.getItem('usernameoremail') || ''
        }
      };
      
      console.log(' Adding fallback comment:', newComment);
      
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment added locally');
    } finally {
      setAddingComment(false);
    }
  };

  // Process JSON API response
  const processAPIPreviewData = (apiData, questionId) => {
    // Extract preview data from API response
    const processedData = {
      id: questionId,
      name: apiData.name || apiData.questionname || question.name || `Question ${questionId}`,
      questiontext: processHTMLContent(apiData.questiontext || apiData.text || ''),
      qtype: apiData.qtype || apiData.type || question.qtype || 'truefalse',
      status: apiData.status || question.status || 'draft',
      defaultmark: apiData.defaultmark || apiData.mark || question.defaultmark || 1,
      penalty: apiData.penalty || 0,
      version: apiData.version || 1,
      answers: extractAnswersFromAPIData(apiData),
      generalfeedback: apiData.generalfeedback || '',
      images: extractImagesFromHTML(apiData.questiontext || apiData.text || ''),
      tags: apiData.tags || question.tags || [],
      // Enhanced: Extract creator and modifier info from API
      createdBy: {
        name: apiData.createdbyuser ? 
          `${apiData.createdbyuser.firstname || ''} ${apiData.createdbyuser.lastname || ''}`.trim() || 
          apiData.createdbyuser.email : 'Unknown',
        date: apiData.timecreated ? new Date(apiData.timecreated * 1000).toLocaleString() : '',
        id: apiData.createdby || null
      },
      modifiedBy: {
        name: apiData.modifiedbyuser ? 
          `${apiData.modifiedbyuser.firstname || ''} ${apiData.modifiedbyuser.lastname || ''}`.trim() || 
          apiData.modifiedbyuser.email : 'Unknown',
        date: apiData.timemodified ? new Date(apiData.timemodified * 1000).toLocaleString() : '',
        id: apiData.modifiedby || null
      },
      // Enhanced: Handle matching question specific data
      matchSubquestions: apiData.match_subquestions || [],
      drags: apiData.drags || [],
      drops: apiData.drops || [],
      usages: apiData.usages || [],
      // ADDED: Store context information for image URLs
      contextId: extractContextId(apiData),
      originalApiData: apiData // Store for reference
    };

    setPreviewData(processedData);

    // Extract technical information
    const techInfo = {
      behaviour: apiData.behaviour || 'Deferred feedback',
      minimumFraction: apiData.minimumfraction || 0,
      maximumFraction: apiData.maximumfraction || 1,
      questionVariant: apiData.variant || processedData.version || 1,
      questionSummary: processedData.questiontext?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
      rightAnswerSummary: getRightAnswerSummaryForMatching(processedData),
      responseSummary: apiData.responsesummary || '',
      questionState: apiData.state || 'todo',
      penalty: processedData.penalty
    };

    setTechnicalInfo(techInfo);
  };

  // Extract context ID from API data
  const extractContextId = (apiData) => {
    // Try to extract context from various places in the API response
    if (apiData.usages && apiData.usages.length > 0) {
      const contextId = apiData.usages[0].contextid;
      if (contextId) {
        console.log(` Found context ID from usages: ${contextId}`);
        return contextId;
      }
    }
    
    if (apiData.drags && apiData.drags.length > 0) {
      // Look for context in drag file URLs
      const dragUrl = apiData.drags[0].fileurl;
      if (dragUrl) {
        const match = dragUrl.match(/pluginfile\.php\/(\d+)\//);
        if (match) {
          const contextId = match[1];
          console.log(` Found context ID from drag URL: ${contextId}`);
          return contextId;
        }
      }
    }
    
    // Default fallback
    console.log(`Using default context ID: 1`);
    return '1';
  };

  // Get right answer summary for matching questions
  const getRightAnswerSummaryForMatching = (questionData) => {
    if (questionData.qtype === 'match' && questionData.matchSubquestions) {
      const pairs = questionData.matchSubquestions
        .filter(sq => sq.questiontext && sq.answertext)
        .map(sq => {
          const question = sq.questiontext.replace(/<[^>]*>/g, '').trim();
          const answer = sq.answertext.replace(/<[^>]*>/g, '').trim();
          return `${question} → ${answer}`;
        });
      return pairs.length > 0 ? pairs.join('; ') : 'Matching pairs available';
    }
    return getRightAnswerSummary(questionData);
  };

  // Parse XML API response
  const parseXMLPreviewData = (xmlText, questionId) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }

      // Extract question data from XML
      const questionElement = xmlDoc.querySelector('question');
      if (!questionElement) {
        throw new Error('No question element found in XML');
      }

      const processedData = {
        id: questionId,
        name: getXMLTextContent(questionElement, 'name') || question.name || `Question ${questionId}`,
        questiontext: processHTMLContent(getXMLInnerHTML(questionElement, 'questiontext') || ''),
        qtype: questionElement.getAttribute('type') || question.qtype || 'truefalse',
        status: getXMLTextContent(questionElement, 'status') || question.status || 'draft',
        defaultmark: parseFloat(getXMLTextContent(questionElement, 'defaultgrade') || getXMLTextContent(questionElement, 'defaultmark') || '1'),
        answers: extractAnswersFromXML(questionElement),
        generalfeedback: getXMLInnerHTML(questionElement, 'generalfeedback') || '',
        images: extractImagesFromHTML(getXMLInnerHTML(questionElement, 'questiontext') || ''),
        tags: extractTagsFromXML(questionElement)
      };

      setPreviewData(processedData);

      // Extract technical information from XML
      const techInfo = {
        behaviour: getXMLTextContent(xmlDoc, 'behaviour') || 'Deferred feedback',
        minimumFraction: parseFloat(getXMLTextContent(xmlDoc, 'minimumfraction') || '0'),
        maximumFraction: parseFloat(getXMLTextContent(xmlDoc, 'maximumfraction') || '1'),
        questionVariant: parseInt(getXMLTextContent(xmlDoc, 'variant') || '1'),
        questionSummary: getXMLTextContent(xmlDoc, 'questionsummary') || processedData.questiontext?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
        rightAnswerSummary: getXMLTextContent(xmlDoc, 'rightanswersummary') || getRightAnswerSummary(processedData),
        responseSummary: getXMLTextContent(xmlDoc, 'responsesummary') || '',
        questionState: getXMLTextContent(xmlDoc, 'state') || 'todo'
      };

      setTechnicalInfo(techInfo);

    } catch (err) {
      console.error(' Error parsing XML:', err);
      // Fallback to question data
      const fallbackData = createMoodlePreviewData(question);
      setPreviewData(fallbackData);
      setTechnicalInfo(createFallbackTechnicalInfo(question));
    }
  };

  // Helper function to get text content from XML
  const getXMLTextContent = (xmlElement, tagName) => {
    const element = xmlElement.querySelector(tagName);
    return element ? element.textContent : '';
  };

  // Helper function to get innerHTML from XML
  const getXMLInnerHTML = (xmlElement, tagName) => {
    const element = xmlElement.querySelector(tagName);
    return element ? element.innerHTML : '';
  };

  // Extract answers from API data
  const extractAnswersFromAPIData = (apiData) => {
    const answers = [];
    
    if (apiData.answers && Array.isArray(apiData.answers)) {
      apiData.answers.forEach((answer, index) => {
        answers.push({
          id: answer.id || index,
          text: answer.text || answer.answertext || '',
          isCorrect: answer.correct || answer.fraction > 0 || false,
          feedback: answer.feedback || '',
          fraction: answer.fraction || 0
        });
      });
    } else if (apiData.qtype === 'ddimageortext') {
      // For drag-and-drop questions, create answers from drags and drops
      if (apiData.drags && apiData.drops) {
        apiData.drags.forEach((drag, index) => {
          answers.push({
            id: drag.drag_id || index,
            text: drag.label || drag.filename || `Drag item ${drag.no || index + 1}`,
            isDragItem: true,
            dragNo: drag.no,
            fileurl: drag.fileurl,
            filename: drag.filename
          });
        });
      }
    } else {
      // Fallback to question data
      return extractAnswersFromQuestionData(question);
    }
    
    return answers;
  };

  // Extract answers from XML
  const extractAnswersFromXML = (questionElement) => {
    const answers = [];
    const answerElements = questionElement.querySelectorAll('answer');
    
    answerElements.forEach((answerEl, index) => {
      const fraction = parseFloat(answerEl.getAttribute('fraction') || '0');
      answers.push({
        id: index,
        text: getXMLInnerHTML(answerEl, 'text') || answerEl.textContent,
        isCorrect: fraction > 0,
        feedback: getXMLInnerHTML(answerEl, 'feedback') || '',
        fraction: fraction
      });
    });

    return answers.length > 0 ? answers : extractAnswersFromQuestionData(question);
  };

  // Extract tags from XML
  const extractTagsFromXML = (questionElement) => {
    const tags = [];
    const tagElements = questionElement.querySelectorAll('tag');
    
    tagElements.forEach(tagEl => {
      const tagText = tagEl.textContent || tagEl.getAttribute('name');
      if (tagText) {
        tags.push(tagText);
      }
    });

    return tags.length > 0 ? tags : (question.tags || []);
  };

  // Create Moodle-style preview data (fallback)
  const createMoodlePreviewData = (questionData) => {
    return {
      id: questionData.id,
      name: questionData.name || questionData.title || `Question ${questionData.id}`,
      questiontext: processHTMLContent(questionData.questiontext || questionData.questionText || ''),
      qtype: questionData.qtype || 'truefalse',
      status: questionData.status || 'draft',
      defaultmark: questionData.defaultmark || questionData.defaultMark || 1,
      answers: extractAnswersFromQuestionData(questionData),
      correctAnswer: questionData.correctAnswer,
      feedbackTrue: questionData.feedbackTrue || '',
      feedbackFalse: questionData.feedbackFalse || '',
      generalfeedback: questionData.generalfeedback || questionData.generalFeedback || '',
      images: extractImagesFromHTML(questionData.questiontext || questionData.questionText || ''),
      tags: questionData.tags || [],
      createdBy: questionData.createdBy || { name: 'Unknown', date: '' },
      modifiedBy: questionData.modifiedBy || { name: 'Unknown', date: '' }
    };
  };

  // Extract answers from question data
  const extractAnswersFromQuestionData = (questionData) => {
    const answers = [];
    
    if (questionData.qtype === 'truefalse') {
      const correctAnswer = questionData.correctAnswer;
      answers.push(
        {
          id: 'true',
          text: 'True',
          isCorrect: correctAnswer === 'true' || correctAnswer === true || correctAnswer === 1,
          feedback: questionData.feedbackTrue || ''
        },
        {
          id: 'false',
          text: 'False',
          isCorrect: correctAnswer === 'false' || correctAnswer === false || correctAnswer === 0,
          feedback: questionData.feedbackFalse || ''
        }
      );
    } else if (questionData.choices && Array.isArray(questionData.choices)) {
      questionData.choices.forEach((choice, index) => {
        answers.push({
          id: index,
          text: choice.text || choice.answer || choice,
          isCorrect: choice.isCorrect || choice.correct || false,
          feedback: choice.feedback || '',
          grade: choice.grade || (choice.isCorrect ? '100%' : '0%')
        });
      });
    } else if (questionData.options && Array.isArray(questionData.options)) {
      questionData.options.forEach((option, index) => {
        const isCorrect = questionData.correctAnswers && questionData.correctAnswers.includes(option);
        answers.push({
          id: index,
          text: option,
          isCorrect: isCorrect,
          feedback: '',
          grade: isCorrect ? '100%' : '0%'
        });
      });
    }
    
    return answers;
  };

  // Process HTML content for images with enhanced image handling
  const processHTMLContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    console.log(' Processing HTML content for images...');
    console.log(' Original HTML:', htmlContent.substring(0, 200) + '...');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Process all images in the content
    const images = tempDiv.querySelectorAll('img');
    console.log(` Found ${images.length} images to process`);
    
    images.forEach((img, index) => {
      const originalSrc = img.getAttribute('src');
      console.log(` Processing image ${index + 1}: ${originalSrc}`);
      
      if (originalSrc) {
        const resolvedSrc = resolveImageURL(originalSrc);
        img.setAttribute('src', resolvedSrc);
        console.log(` Updated image src: ${originalSrc} → ${resolvedSrc}`);
        
        // Add error handling attributes
        img.setAttribute('onerror', `console.error('Failed to load image: ${resolvedSrc}'); this.style.border='2px solid red'; this.alt='Image failed to load: ${originalSrc}';`);
        
        // Add responsive styling
        if (!img.style.maxWidth) {
          img.style.maxWidth = '100%';
        }
        img.style.height = 'auto';
        img.style.borderRadius = '4px';
        img.style.display = 'block';
        img.style.margin = '10px auto';
        
        // Add title for debugging
        img.setAttribute('title', `Original: ${originalSrc}\nResolved: ${resolvedSrc}`);
      } else {
        console.warn(` Image ${index + 1} has no src attribute`);
      }
    });
    
    // Handle @@PLUGINFILE@@ placeholders in the HTML
    let processedHTML = tempDiv.innerHTML;
    
    // Replace @@PLUGINFILE@@ references with proper context
    processedHTML = processedHTML.replace(/@@PLUGINFILE@@\/([^"'\s]+)/g, (match, filename) => {
      const baseURL = API_BASE_URL.replace('/api', '');
      const questionId = previewData?.id || question?.id || '0';
      const contextId = '1'; // Default context, you might need to get this from API
      
      const resolvedURL = `${baseURL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${filename}`;
      console.log(` Replaced @@PLUGINFILE@@ with context: ${match} → ${resolvedURL}`);
      return resolvedURL;
    });
    
    // Handle other Moodle file references
    processedHTML = processedHTML.replace(/src=["']([^"']*webservice\/pluginfile\.php[^"']*)["']/g, (match, url) => {
      if (!url.startsWith('http')) {
        const baseURL = API_BASE_URL.replace('/api', '');
        const resolvedURL = url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`;
        console.log(` Fixed pluginfile URL: ${url} → ${resolvedURL}`);
        return `src="${resolvedURL}"`;
      }
      return match;
    });
    
    console.log(' HTML processing complete');
    return processedHTML;
  };

  // Extract images from HTML content with enhanced detection
  const extractImagesFromHTML = (htmlContent) => {
    if (!htmlContent) return [];
    
    const images = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Look for all img elements
    const imgElements = tempDiv.querySelectorAll('img');
    console.log(` Found ${imgElements.length} img elements in HTML`);
    
    imgElements.forEach((img, index) => {
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || `Image ${index + 1}`;
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      
      console.log(` Processing image ${index + 1}:`, { src, alt, width, height });
      
      if (src) {
        const resolvedSrc = resolveImageURL(src);
        images.push({
          src: resolvedSrc,
          originalSrc: src,
          alt,
          width,
          height,
          style: img.getAttribute('style') || ''
        });
        console.log(` Added image: ${resolvedSrc}`);
      } else {
        console.warn(` Image ${index + 1} has no src attribute`);
      }
    });
    
    // Also look for background images in style attributes
    const elementsWithBackgrounds = tempDiv.querySelectorAll('[style*="background-image"]');
    elementsWithBackgrounds.forEach((element, index) => {
      const style = element.getAttribute('style');
      const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
      if (bgImageMatch) {
        const src = bgImageMatch[1];
        const resolvedSrc = resolveImageURL(src);
        images.push({
          src: resolvedSrc,
          originalSrc: src,
          alt: `Background Image ${index + 1}`,
          isBackground: true
        });
        console.log(` Added background image: ${resolvedSrc}`);
      }
    });
    
    // Look for common Moodle image patterns in the HTML
    const moodleImagePatterns = [
      /@@PLUGINFILE@@\/([^"'\s]+)/g,
      /webservice\/pluginfile\.php\/[^"'\s]+/g,
      /draftfile\.php\/[^"'\s]+/g
    ];
    
    moodleImagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(htmlContent)) !== null) {
        const src = match[0].replace('@@PLUGINFILE@@/', '');
        const resolvedSrc = resolveImageURL(src);
        images.push({
          src: resolvedSrc,
          originalSrc: match[0],
          alt: 'Moodle File',
          isMoodleFile: true
        });
        console.log(` Added Moodle file: ${resolvedSrc}`);
      }
    });
    
    console.log(` Total images found: ${images.length}`);
    return images;
  };

  // Enhanced image URL resolution with better Moodle support
  const resolveImageURL = (src) => {
    if (!src) {
      console.warn(' Empty image src provided');
      return '';
    }
    
    console.log(` Resolving image URL: ${src}`);
    
    // If already absolute URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      console.log(` Already absolute URL: ${src}`);
      return src;
    }
    
    // Handle Moodle pluginfile URLs
    if (src.includes('pluginfile.php') || src.includes('webservice/pluginfile.php')) {
      // If it's already a relative pluginfile URL, make it absolute
      const baseURL = API_BASE_URL.replace('/api', '');
      const fullSrc = src.startsWith('/') ? `${baseURL}${src}` : `${baseURL}/${src}`;
      console.log(` Moodle pluginfile URL resolved: ${fullSrc}`);
      return fullSrc;
    }
    
    // Handle @@PLUGINFILE@@ placeholders - FIXED with proper context
    if (src.includes('@@PLUGINFILE@@')) {
      const baseURL = API_BASE_URL.replace('/api', '');
      const cleanSrc = src.replace('@@PLUGINFILE@@/', '');
      
      // FIXED: Use proper Moodle pluginfile URL structure with extracted context
      const questionId = previewData?.id || question?.id || '0';
      const contextId = previewData?.contextId || '30'; // Use extracted context or fallback
      
      const fullSrc = `${baseURL}/pluginfile.php/${contextId}/question/questiontext/${questionId}/${cleanSrc}`;
      console.log(`@@PLUGINFILE@@ resolved with context ${contextId}: ${fullSrc}`);
      return fullSrc;
    }
    
    // Handle relative URLs
    const baseURL = API_BASE_URL.replace('/api', '');
    const cleanSrc = src.startsWith('/') ? src : `/${src}`;
    const fullSrc = `${baseURL}${cleanSrc}`;
    
    console.log(`Relative URL resolved: ${fullSrc}`);
    return fullSrc;
  };

  // Get right answer summary
  const getRightAnswerSummary = (questionData) => {
    if (!questionData.answers || questionData.answers.length === 0) {
      return 'No answers available';
    }

    const correctAnswers = questionData.answers.filter(answer => answer.isCorrect);
    if (correctAnswers.length === 0) {
      return 'No correct answer defined';
    }

    if (questionData.qtype === 'truefalse') {
      return correctAnswers[0].text;
    }

    return correctAnswers.map(answer => answer.text).join(', ');
  };

  // Create fallback technical info
  const createFallbackTechnicalInfo = (questionData) => {
    return {
      behaviour: 'Deferred feedback',
      minimumFraction: 0,
      maximumFraction: 1,
      questionVariant: 1,
      questionSummary: (questionData.questiontext || questionData.questionText || '').replace(/<[^>]*>/g, '').substring(0, 100) || 'No summary available',
      rightAnswerSummary: getRightAnswerSummary(createMoodlePreviewData(questionData)),
      responseSummary: '',
      questionState: 'todo'
    };
  };

  // Get question type display name
  const getQuestionTypeName = (qtype) => {
    const typeMap = {
      'truefalse': 'True/False',
      'multichoice': 'Multiple choice',
      'essay': 'Essay',
      'shortanswer': 'Short answer',
      'matching': 'Matching',
      'ddimageortext': 'Drag and drop into text',
      'gapselect': 'Select missing words',
      'ddmarker': 'Drag and drop markers'
    };
    return typeMap[qtype] || qtype;
  };

  // Render the main question content
  const renderQuestionContent = () => {
    if (!previewData) return null;

    return (
      <div className="moodle-question-content">
        {/* Question Header */}
        <div className="question-header" style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px 15px', 
          border: '1px solid #dee2e6',
          borderRadius: '4px 4px 0 0',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ 
                margin: '0', 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Version 1 (latest)
                </span>
                {previewData.name}
              </h3>
            </div>
            <button
              onClick={onRequestClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Question Body */}
        <div className="question-body" style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #dee2e6',
          borderTop: 'none',
          padding: '20px',
          minHeight: '200px'
        }}>
          {/* Question Info */}
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#6c757d' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span><strong>Question 1</strong></span>
              <span>Not yet answered</span>
              <span>Marked out of {previewData.defaultmark}.00</span>
              {previewData.penalty > 0 && (
                <span>Penalty: {(previewData.penalty * 100).toFixed(1)}%</span>
              )}
              {previewData.version && (
                <span>Version: {previewData.version}</span>
              )}
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                previewData.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {previewData.status?.toUpperCase()}
              </span>
            </div>
            
            {/* Creator and Modifier Info */}
            {(previewData.createdBy?.name !== 'Unknown' || previewData.modifiedBy?.name !== 'Unknown') && (
              <div style={{ 
                fontSize: '12px', 
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                {previewData.createdBy?.name !== 'Unknown' && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Created:</strong> {previewData.createdBy.date} by {previewData.createdBy.name}
                  </div>
                )}
                {previewData.modifiedBy?.name !== 'Unknown' && (
                  <div>
                    <strong>Modified:</strong> {previewData.modifiedBy.date} by {previewData.modifiedBy.name}
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Question Text */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#212529'
              }}
              dangerouslySetInnerHTML={{ __html: previewData.questiontext }}
            />
          </div>

          {/* Answer Options for True/False */}
          {previewData.qtype === 'truefalse' && (
            <div className="answer-options">
              {previewData.answers.map((answer) => (
                <div key={answer.id} style={{ marginBottom: '8px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    <input
                      type="radio"
                      name={`question_${previewData.id}`}
                      value={answer.id}
                      style={{ marginRight: '8px' }}
                      disabled
                    />
                    {answer.text}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Answer Options for Multiple Choice */}
          {previewData.qtype === 'multichoice' && (
            <div className="answer-options">
              {previewData.answers.map((answer, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}>
                    <input
                      type="radio"
                      name={`question_${previewData.id}`}
                      value={index}
                      style={{ marginRight: '8px' }}
                      disabled
                    />
                    <div dangerouslySetInnerHTML={{ __html: processHTMLContent(answer.text) }} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Matching Question with real data */}
          {previewData.qtype === 'match' && (
            <div className="answer-options">
              {previewData.matchSubquestions && previewData.matchSubquestions.length > 0 ? (
                <div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '15px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      Matching Question Preview
                    </h5>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6c757d' 
                    }}>
                      In the actual quiz, drag items from the left to match with the correct answers on the right.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Left Column - Questions */}
                    <div>
                      <h6 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #007bff',
                        paddingBottom: '5px'
                      }}>
                        Questions/Descriptions
                      </h6>
                      {previewData.matchSubquestions
                        .filter(sq => sq.questiontext && sq.questiontext.trim())
                        .map((subquestion, index) => (
                        <div key={subquestion.id || index} style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.questiontext) 
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Right Column - Answers */}
                    <div>
                      <h6 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #28a745',
                        paddingBottom: '5px'
                      }}>
                        Answer Options
                      </h6>
                      {previewData.matchSubquestions
                        .filter(sq => sq.answertext && sq.answertext.trim())
                        .map((subquestion, index) => (
                        <div key={`answer-${subquestion.id || index}`} style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#155724',
                          textAlign: 'center'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.answertext) 
                            }}
                          />
                        </div>
                      ))}

                      {/* Show any extra answer options that don't have corresponding questions */}
                      {previewData.matchSubquestions
                        .filter(sq => !sq.questiontext || !sq.questiontext.trim())
                        .filter(sq => sq.answertext && sq.answertext.trim())
                        .map((subquestion, index) => (
                        <div key={`extra-answer-${subquestion.id || index}`} style={{
                          backgroundColor: '#e9ecef',
                          border: '1px solid #6c757d',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057',
                          textAlign: 'center'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.answertext) 
                            }}
                          />
                          <small style={{ 
                            display: 'block', 
                            marginTop: '5px', 
                            fontSize: '12px',
                            color: '#6c757d'
                          }}>
                            (Distractor)
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Show matching pairs for reference */}
                  <div style={{ marginTop: '20px' }}>
                    <details style={{ 
                      backgroundColor: '#e7f3ff',
                      border: '1px solid #b8daff',
                      borderRadius: '4px',
                      padding: '15px'
                    }}>
                      <summary style={{ 
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#004085',
                        fontSize: '14px'
                      }}>
                        Show Correct Matching Pairs
                      </summary>
                      <div style={{ marginTop: '10px' }}>
                        {previewData.matchSubquestions
                          .filter(sq => sq.questiontext && sq.questiontext.trim() && sq.answertext && sq.answertext.trim())
                          .map((subquestion, index) => (
                          <div key={`pair-${subquestion.id || index}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #b8daff',
                            fontSize: '13px'
                          }}>
                            <div style={{ flex: 1, color: '#004085' }}>
                              <div dangerouslySetInnerHTML={{ 
                                __html: processHTMLContent(subquestion.questiontext).replace(/<[^>]*>/g, '') 
                              }} />
                            </div>
                            <div style={{ padding: '0 15px', color: '#6c757d' }}>→</div>
                            <div style={{ flex: 1, fontWeight: '600', color: '#155724' }}>
                              <div dangerouslySetInnerHTML={{ 
                                __html: processHTMLContent(subquestion.answertext).replace(/<[^>]*>/g, '') 
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  fontSize: '14px',
                  color: '#6c757d'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                    <strong>Matching Question:</strong>
                  </p>
                  <p style={{ margin: '0' }}>
                    This is a drag-and-drop matching question. The matching pairs are not available in the preview.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Drag and Drop Image Question */}
          {previewData.qtype === 'ddimageortext' && (
            <div className="answer-options">
              {previewData.drags && previewData.drags.length > 0 ? (
                <div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '15px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      Drag and Drop Question Preview
                    </h5>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6c757d' 
                    }}>
                      In the actual quiz, drag the images below to the appropriate drop zones in the question area.
                    </p>
                  </div>

                  {/* Drop Zones Area */}
                  {previewData.drops && previewData.drops.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h6 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #dc3545',
                        paddingBottom: '5px'
                      }}>
                        Drop Zones ({previewData.drops.length})
                      </h6>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        {previewData.drops.map((drop, index) => (
                          <div
                            key={drop.drop_id || index}
                            style={{
                              width: '120px',
                              height: '80px',
                              border: '2px dashed #dc3545',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fff5f5',
                              fontSize: '12px',
                              color: '#dc3545',
                              fontWeight: '500'
                            }}
                          >
                            Drop Zone {drop.no || index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Draggable Items */}
                  <div style={{ marginBottom: '20px' }}>
                    <h6 style={{ 
                      margin: '0 0 15px 0', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#495057',
                      borderBottom: '2px solid #007bff',
                      paddingBottom: '5px'
                    }}>
                      Draggable Items ({previewData.drags.length})
                    </h6>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '15px'
                    }}>
                      {previewData.drags.map((drag, index) => (
                        <div
                          key={drag.drag_id || index}
                          style={{
                            border: '2px solid #007bff',
                            borderRadius: '8px',
                            padding: '10px',
                            backgroundColor: '#ffffff',
                            textAlign: 'center',
                            cursor: 'grab',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                        >
                          {drag.fileurl ? (
                            <div>
                              <img
                                src={drag.fileurl}
                                alt={drag.filename || `Drag item ${drag.no || index + 1}`}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100px',
                                  objectFit: 'contain',
                                  borderRadius: '4px',
                                  marginBottom: '8px'
                                }}
                                onLoad={(e) => {
                                  console.log('Successfully loaded image:', drag.fileurl);
                                }}
                                onError={(e) => {
                                  console.error('Failed to load drag image:', drag.fileurl);
                                  console.error(' Error details:', e);
                                  
                                  // Try with authentication token
                                  const token = localStorage.getItem('token');
                                  if (token && !drag.fileurl.includes('token=')) {
                                    const authUrl = `${drag.fileurl}${drag.fileurl.includes('?') ? '&' : '?'}token=${token}`;
                                    console.log(' Retrying with token:', authUrl);
                                    e.target.src = authUrl;
                                    return;
                                  }
                                  
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                  e.target.nextSibling.innerHTML = `
                                    <div style="color: #dc3545; font-weight: 500;"> Image Load Failed</div>
                                    <div style="font-size: 10px; margin-top: 5px;">URL: ${drag.fileurl}</div>
                                    <div style="font-size: 10px;">Check Network tab for details</div>
                                  `;
                                }}
                              />
                              <div 
                                style={{ 
                                  display: 'none',
                                  padding: '20px',
                                  backgroundColor: '#f8f9fa',
                                  color: '#6c757d',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  textAlign: 'center'
                                }}
                              >
                                Image failed to load
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: '#6c757d',
                                fontWeight: '500',
                                marginTop: '5px'
                              }}>
                                Item {drag.no || index + 1}
                              </div>
                              {drag.filename && (
                                <div style={{
                                  fontSize: '10px',
                                  color: '#495057',
                                  marginTop: '2px',
                                  wordBreak: 'break-word'
                                }}>
                                  {drag.filename.length > 20 
                                    ? `${drag.filename.substring(0, 20)}...` 
                                    : drag.filename
                                  }
                                </div>
                              )}
                            </div>
                          ) : drag.label ? (
                            <div style={{
                              padding: '20px 10px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#495057'
                            }}>
                              {drag.label}
                            </div>
                          ) : (
                            <div style={{
                              padding: '20px 10px',
                              fontSize: '14px',
                              color: '#6c757d'
                            }}>
                              Drag Item {drag.no || index + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage/Answer Information */}
                  {previewData.usages && previewData.usages.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <details style={{ 
                        backgroundColor: '#e7f3ff',
                        border: '1px solid #b8daff',
                        borderRadius: '4px',
                        padding: '15px'
                      }}>
                        <summary style={{ 
                          cursor: 'pointer',
                          fontWeight: '600',
                          color: '#004085',
                          fontSize: '14px'
                        }}>
                          Show Answer Information
                        </summary>
                        <div style={{ marginTop: '10px' }}>
                          {previewData.usages.map((usage, usageIndex) => (
                            <div key={usage.id || usageIndex} style={{ marginBottom: '10px' }}>
                              <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#004085' }}>
                                Usage {usageIndex + 1}:
                              </h6>
                              {usage.attempts && usage.attempts.map((attempt, attemptIndex) => (
                                <div key={attempt.id || attemptIndex} style={{
                                  fontSize: '12px',
                                  color: '#495057',
                                  backgroundColor: '#ffffff',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  marginBottom: '5px'
                                }}>
                                  <div><strong>Right Answer:</strong> {attempt.rightanswer}</div>
                                  <div><strong>Fraction:</strong> {attempt.fraction}</div>
                                  <div><strong>Behaviour:</strong> {attempt.behaviour}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  fontSize: '14px',
                  color: '#6c757d'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                    <strong>Drag and Drop Question:</strong>
                  </p>
                  <p style={{ margin: '0' }}>
                    This is a drag-and-drop question, but no draggable items are available in the preview.
                  </p>
                </div>
              )}
            </div>
          )}
            <div className="answer-options">
              {previewData.matchSubquestions && previewData.matchSubquestions.length > 0 ? (
                <div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '15px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 10px 0', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#495057'
                    }}>
                      Matching Question Preview
                    </h5>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6c757d' 
                    }}>
                      In the actual quiz, drag items from the left to match with the correct answers on the right.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Left Column - Questions */}
                    <div>
                      <h6 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #007bff',
                        paddingBottom: '5px'
                      }}>
                        Questions/Descriptions
                      </h6>
                      {previewData.matchSubquestions
                        .filter(sq => sq.questiontext && sq.questiontext.trim())
                        .map((subquestion, index) => (
                        <div key={subquestion.id || index} style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.questiontext) 
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Right Column - Answers */}
                    <div>
                      <h6 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#495057',
                        borderBottom: '2px solid #28a745',
                        paddingBottom: '5px'
                      }}>
                        Answer Options
                      </h6>
                      {previewData.matchSubquestions
                        .filter(sq => sq.answertext && sq.answertext.trim())
                        .map((subquestion, index) => (
                        <div key={`answer-${subquestion.id || index}`} style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#155724',
                          textAlign: 'center'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.answertext) 
                            }}
                          />
                        </div>
                      ))}

                      {/* Show any extra answer options that don't have corresponding questions */}
                      {previewData.matchSubquestions
                        .filter(sq => !sq.questiontext || !sq.questiontext.trim())
                        .filter(sq => sq.answertext && sq.answertext.trim())
                        .map((subquestion, index) => (
                        <div key={`extra-answer-${subquestion.id || index}`} style={{
                          backgroundColor: '#e9ecef',
                          border: '1px solid #6c757d',
                          borderRadius: '4px',
                          padding: '12px',
                          marginBottom: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#495057',
                          textAlign: 'center'
                        }}>
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: processHTMLContent(subquestion.answertext) 
                            }}
                          />
                          <small style={{ 
                            display: 'block', 
                            marginTop: '5px', 
                            fontSize: '12px',
                            color: '#6c757d'
                          }}>
                            (Distractor)
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Show matching pairs for reference */}
                  <div style={{ marginTop: '20px' }}>
                    <details style={{ 
                      backgroundColor: '#e7f3ff',
                      border: '1px solid #b8daff',
                      borderRadius: '4px',
                      padding: '15px'
                    }}>
                      <summary style={{ 
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#004085',
                        fontSize: '14px'
                      }}>
                        Show Correct Matching Pairs
                      </summary>
                      <div style={{ marginTop: '10px' }}>
                        {previewData.matchSubquestions
                          .filter(sq => sq.questiontext && sq.questiontext.trim() && sq.answertext && sq.answertext.trim())
                          .map((subquestion, index) => (
                          <div key={`pair-${subquestion.id || index}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #b8daff',
                            fontSize: '13px'
                          }}>
                            <div style={{ flex: 1, color: '#004085' }}>
                              <div dangerouslySetInnerHTML={{ 
                                __html: processHTMLContent(subquestion.questiontext).replace(/<[^>]*>/g, '') 
                              }} />
                            </div>
                            <div style={{ padding: '0 15px', color: '#6c757d' }}>→</div>
                            <div style={{ flex: 1, fontWeight: '600', color: '#155724' }}>
                              <div dangerouslySetInnerHTML={{ 
                                __html: processHTMLContent(subquestion.answertext).replace(/<[^>]*>/g, '') 
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  fontSize: '14px',
                  color: '#6c757d'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                    <strong>Matching Question:</strong>
                  </p>
                  <p style={{ margin: '0' }}>
                    This is a drag-and-drop matching question. The matching pairs are not available in the preview.
                  </p>
                </div>
              )}
            </div>
          
          {/* Essay Question */}
          {previewData.qtype === 'essay' && (
            <div className="answer-options">
              <textarea
                placeholder="Please write your answer here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                disabled
              />
            </div>
          )}

          {/* Short Answer Question */}
          {previewData.qtype === 'shortanswer' && (
            <div className="answer-options">
              <input
                type="text"
                placeholder="Answer:"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                disabled
              />
            </div>
          )}

          {/* Generic question type fallback */}
          {!['truefalse', 'multichoice', 'match', 'essay', 'shortanswer'].includes(previewData.qtype) && (
            <div className="answer-options">
              <div style={{
                backgroundColor: '#e7f3ff',
                border: '1px solid #b8daff',
                borderRadius: '4px',
                padding: '15px',
                fontSize: '14px',
                color: '#004085'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                  <strong>Question Type: {previewData.qtype}</strong>
                </p>
                <p style={{ margin: '0' }}>
                  This question type requires special interaction that cannot be fully previewed in this format.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="question-actions" style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          border: '1px solid #dee2e6',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Start again
          </button>
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Save
          </button>
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Fill in correct responses
          </button>
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Submit and finish
          </button>
          <button 
            onClick={onRequestClose}
            style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Close preview
          </button>
        </div>
      </div>
    );
  };

  // Render comments section with real API data
  const renderComments = () => (
    <div className="comments-section" style={{ marginTop: '20px' }}>
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            border: 'none',
            borderBottom: showComments ? '1px solid #dee2e6' : 'none',
            borderRadius: showComments ? '4px 4px 0 0' : '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{showComments ? '▼' : '▶'}</span>
          Comments {comments.length > 0 && `(${comments.length})`}
        </button>
        
        {showComments && (
          <div style={{ padding: '15px' }}>
            {/* Display real comments from API with proper user info */}
            {comments.length >  0 ? (
              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                {comments.map((comment, index) => {
                  // Handle the exact API format you're receiving
                  console.log(' Processing comment:', comment);
                  
                  // Extract user info from the nested user object
                  const userInfo = comment.user || {};
                  const author = userInfo.firstname && userInfo.lastname 
                    ? `${userInfo.firstname} ${userInfo.lastname}`.trim()
                    : userInfo.firstname || userInfo.lastname || comment.author || comment.username || 'Unknown User';
                  
                  // Format the timestamp
                  let formattedDate = 'Invalid Date';
                  try {
                    if (comment.timecreated) {
                      // Convert Unix timestamp to readable date
                      formattedDate = new Date(comment.timecreated * 1000).toLocaleString();
                    } else if (comment.date) {
                      formattedDate = comment.date;
                    } else if (comment.created_at) {
                      formattedDate = new Date(comment.created_at).toLocaleString();
                    }
                  } catch (err) {
                    console.warn('Date formatting error:', err);
                    formattedDate = 'Unknown date';
                  }

                  const text = comment.content || comment.text || comment.comment || '';
                  const userId = comment.userid || userInfo.id || comment.user_id;

                  return (
                    <div key={comment.id || index} style={{ 
                      marginBottom: '12px', 
                      paddingBottom: '12px', 
                      borderBottom: index < comments.length - 1 ? '1px solid #e9ecef' : 'none' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {/* Profile Image if available */}
                        {userInfo.profileimageurl && (
                          <img
                            src={userInfo.profileimageurl}
                            alt={author}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #e9ecef'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <strong style={{ color: '#495057', fontSize: '14px' }}>{author}</strong>
                          <div style={{ color: '#6c757d', fontSize: '12px' }}>{formattedDate}</div>
                        </div>
                      </div>
                      <div style={{ 
                        color: '#495057', 
                        marginLeft: userInfo.profileimageurl ? '36px' : '0',
                        lineHeight: '1.4',
                        fontSize: '14px'
                      }}>
                        {text}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginBottom: '15px', fontSize: '14px', color: '#6c757d', fontStyle: 'italic' }}>
                No comments yet.
              </div>
            )}
            
            {/* Add new comment with current user info */}
            <div>
              {currentUser && (
                <div style={{ 
                  marginBottom: '8px', 
                  fontSize: '13px', 
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {currentUser.profileimageurl && (
                    <img
                      src={currentUser.profileimageurl}
                      alt={currentUser.username}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <span>Commenting as: <strong>{currentUser.fullname || currentUser.username}</strong></span>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                disabled={addingComment}
              />
              <button
                onClick={() => addComment(commentText)}
                disabled={addingComment || !commentText.trim()}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: addingComment ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: addingComment ? 'not-allowed' : 'pointer',
                  opacity: addingComment || !commentText.trim() ? 0.6 : 1,
                  fontWeight: '500'
                }}
              >
                {addingComment ? 'Saving...' : 'Save comment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render preview options section
  const renderPreviewOptions = () => (
    <div className="preview-options-section" style={{ marginTop: '20px' }}>
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => setShowPreviewOptions(!showPreviewOptions)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            border: 'none',
            borderBottom: showPreviewOptions ? '1px solid #dee2e6' : 'none',
            borderRadius: showPreviewOptions ? '4px 4px 0 0' : '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{showPreviewOptions ? '▼' : '▶'}</span>
          Preview options
        </button>
        
        {showPreviewOptions && (
          <div style={{ padding: '15px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
              These settings are for testing the question. The options you select only affect the preview.
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Question version
              </label>
              <select 
                value={previewSettings.questionVersion}
                onChange={(e) => setPreviewSettings({...previewSettings, questionVersion: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="latest">Always latest</option>
                <option value="version1">Version 1</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                How questions behave
                <span style={{ marginLeft: '5px', color: '#17a2b8', cursor: 'help' }}>ⓘ</span>
              </label>
              <select 
                value={previewSettings.behavior}
                onChange={(e) => setPreviewSettings({...previewSettings, behavior: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="deferred">Deferred feedback</option>
                <option value="immediate">Immediate feedback</option>
                <option value="interactive">Interactive with multiple tries</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Marked out of
              </label>
              <input
                type="number"
                value={previewSettings.markedOutOf}
                onChange={(e) => setPreviewSettings({...previewSettings, markedOutOf: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '80px'
                }}
              />
            </div>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onClick={() => {
                toast.info('Preview options updated');
                // Here you could implement actual preview refresh
              }}
            >
              Save preview options and start again
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render display options section
  const renderDisplayOptions = () => (
    <div className="display-options-section" style={{ marginTop: '20px' }}>
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => setShowDisplayOptions(!showDisplayOptions)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            border: 'none',
            borderBottom: showDisplayOptions ? '1px solid #dee2e6' : 'none',
            borderRadius: showDisplayOptions ? '4px 4px 0 0' : '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{showDisplayOptions ? '▼' : '▶'}</span>
          Display options
        </button>
        
        {showDisplayOptions && (
          <div style={{ padding: '15px' }}>
            {[
              { label: 'Whether correct', value: previewSettings.showCorrect, key: 'showCorrect' },
              { label: 'Marks', value: previewSettings.marks, key: 'marks' },
              { label: 'Specific feedback', value: previewSettings.specificFeedback, key: 'specificFeedback' },
              { label: 'General feedback', value: previewSettings.generalFeedback, key: 'generalFeedback' },
              { label: 'Right answer', value: previewSettings.rightAnswer, key: 'rightAnswer' },
              { label: 'Response history', value: previewSettings.responseHistory, key: 'responseHistory' }
            ].map((option, index) => (
              <div key={index} className="form-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: '500', minWidth: '120px' }}>
                  {option.label}
                </label>
                <select 
                  value={option.value}
                  onChange={(e) => setPreviewSettings({...previewSettings, [option.key]: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minWidth: '150px'
                  }}
                >
                  <option value="shown">Shown</option>
                  <option value="not_shown">Not shown</option>
                  {option.key === 'marks' && <option value="show_mark_and_max">Show mark and max</option>}
                </select>
              </div>
            ))}

            <div className="form-group" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: '500', minWidth: '120px' }}>
                Decimal places in grades
              </label>
              <input
                type="number"
                value={previewSettings.decimalPlaces}
                onChange={(e) => setPreviewSettings({...previewSettings, decimalPlaces: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '80px'
                }}
              />
            </div>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              onClick={() => {
                toast.info('Display options updated');
                // Here you could implement actual display refresh
              }}
            >
              Update display options
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Question Preview - Moodle Style"
      style={{
        overlay: { 
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        },
        content: {
          maxWidth: '95vw',
          width: '10000px',
          margin: 'auto',
          maxHeight: '95vh',
          overflowY: 'auto',
          top: '2.5%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translateX(-50%)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          backgroundColor: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
      }}
    >
      <div className="moodle-preview-container">
        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            fontSize: '16px',
            color: '#6c757d'
          }}>
            <div style={{ marginRight: '10px' }}>🔄</div>
            Loading preview data from API...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            <strong>Error loading preview:</strong> {error}
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Falling back to basic question data...
            </div>
          </div>
        )}

        {/* Main Question Content */}
        {!loading && previewData && renderQuestionContent()}

        {/* Comments Section */}
        {!loading && renderComments()}

        {/* Preview Options */}
        {!loading && renderPreviewOptions()}

        {/* Display Options */}
        {!loading && renderDisplayOptions()}

        {/* Technical Information with real API data */}
        {!loading && (
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
            <div style={{ marginBottom: '10px' }}>
              <button
                onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                Technical information {showTechnicalInfo ? '▼' : '▶'}
              </button>
            </div>
            
            {showTechnicalInfo && technicalInfo && (
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: '#17a2b8', marginRight: '5px' }}>ⓘ</span>
                  <strong>Behaviour being used:</strong> {technicalInfo.behaviour}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Minimum fraction:</strong> {technicalInfo.minimumFraction}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Maximum fraction:</strong> {technicalInfo.maximumFraction}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Question variant:</strong> {technicalInfo.questionVariant}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Question summary:</strong> {technicalInfo.questionSummary}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Right answer summary:</strong> {technicalInfo.rightAnswerSummary}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Response summary:</strong> {technicalInfo.responseSummary || 'No response yet'}
                </div>
                <div>
                  <strong>Question state:</strong> {technicalInfo.questionState}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '16px', margin: '0 0 10px 0', fontWeight: '600' }}>
                Question custom fields
              </h4>
            </div>
            
            <div>
              <a 
                href="#" 
                style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}
                onClick={(e) => {
                  e.preventDefault();
                  // Handle download - integrate with your API
                  toast.info('Downloading question in Moodle XML format...');
                  
                  // Example: trigger download from your API
                  if (previewData?.id) {
                    const downloadUrl = `${API_BASE_URL}/questions/export?questionid=${previewData.id}&format=xml`;
                    window.open(downloadUrl, '_blank');
                  }
                }}
              >
                Download this question in Moodle XML format
              </a>
            </div>
          </div>
        )}
      </div>
    </ReactModal>
  );
}

export default QuestionPreviewModal;