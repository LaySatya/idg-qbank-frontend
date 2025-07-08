import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-hot-toast';

const QuestionPreviewFilter = ({ 
  isOpen, 
  onRequestClose, 
  question,
  onEdit,
  onDuplicate,
  onDelete 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [questionState, setQuestionState] = useState('todo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingComment, setAddingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [technicalInfo, setTechnicalInfo] = useState(null);

  // API Base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

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

  // Get current user info
  useEffect(() => {
    getCurrentUserInfo();
  }, []);

  // Fetch preview data when modal opens
  useEffect(() => {
    if (isOpen && question?.id) {
      getCurrentUserInfo();
      fetchPreviewData(question.id);
      fetchComments(question.id);
    }
  }, [isOpen, question?.id]);

  const getCurrentUserInfo = () => {
    try {
      const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
      const userid = localStorage.getItem('userid');
      const profileImage = localStorage.getItem('profileimageurl');
      
      if (username && userid) {
        setCurrentUser({
          id: userid,
          username: username,
          profileimageurl: profileImage,
          firstname: localStorage.getItem('firstname') || '',
          lastname: localStorage.getItem('lastname') || ''
        });
      }
    } catch (err) {
      console.error(' Error getting current user info:', err);
      setCurrentUser({
        id: localStorage.getItem('userid') || '1',
        username: 'Current User',
        profileimageurl: null
      });
    }
  };

  // Fetch preview data from API
  const fetchPreviewData = async (questionId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(` Fetching preview data for question: ${questionId}`);
      
      const response = await fetch(`${API_BASE_URL}/questions/preview?questionid=${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(' Preview data received:', data);
      
      // Process the preview data
      const processedData = processAPIPreviewData(data, questionId);
      setPreviewData(processedData);
      
      // Set technical information
      setTechnicalInfo(extractTechnicalInfo(data));
      
    } catch (err) {
      console.error(' Error fetching preview data:', err);
      setError(err.message);
      
      // Fallback to question data
      if (question) {
        const fallbackData = createFallbackPreviewData(question);
        setPreviewData(fallbackData);
        setTechnicalInfo(createFallbackTechnicalInfo(question));
      }
    } finally {
      setLoading(false);
    }
  };

  // Process API preview data based on question type
  const processAPIPreviewData = (apiData, questionId) => {
    const processedData = {
      id: questionId,
      name: apiData.name || question.name || `Question ${questionId}`,
      questiontext: processHTMLContent(apiData.questiontext || ''),
      qtype: apiData.qtype || question.qtype || 'multichoice',
      status: apiData.status || question.status || 'draft',
      defaultmark: apiData.defaultmark || question.defaultmark || 1,
      penalty: apiData.penalty || 0,
      version: apiData.version || 1,
      answers: processAnswers(apiData.answers || [], apiData.qtype),
      generalfeedback: apiData.generalfeedback || '',
      createdBy: extractUserInfo(apiData.createdbyuser, apiData.timecreated),
      modifiedBy: extractUserInfo(apiData.modifiedbyuser, apiData.timemodified),
      
      // Question type specific data
      matchSubquestions: apiData.match_subquestions || [],
      drags: apiData.drags || [],
      drops: apiData.drops || [],
      usages: apiData.usages || [],
      
      // FIXED: For ddwtos questions, extract drag items from answers if drags array is empty
      dragItems: extractDragItemsForDdwtos(apiData),
      
      // Store original API data for reference
      originalApiData: apiData
    };

    return processedData;
  };

  // NEW: Extract drag items for ddwtos questions
  const extractDragItemsForDdwtos = (apiData) => {
    if (apiData.qtype === 'ddwtos') {
      // For ddwtos questions, the drag items are usually in the answers array
      if (apiData.answers && Array.isArray(apiData.answers)) {
        return apiData.answers.map((answer, index) => ({
          id: answer.id || index,
          no: index + 1,
          label: answer.answer || answer.text || `Item ${index + 1}`,
          text: answer.answer || answer.text || `Item ${index + 1}`,
          infinite: false, // Default to false, parse from feedback if needed
          draggroup: 1, // Default group
          noofdrags: 1
        }));
      }
    }
    return apiData.drags || [];
  };

  // Process answers based on question type
  const processAnswers = (answers, qtype) => {
    if (!Array.isArray(answers)) return [];
    
    return answers.map((answer, index) => ({
      id: answer.id || index,
      text: answer.answer || answer.text || '',
      isCorrect: answer.fraction > 0,
      feedback: answer.feedback || '',
      fraction: answer.fraction || 0,
      answerformat: answer.answerformat || 1
    }));
  };

  // Extract user information
  const extractUserInfo = (userObj, timestamp) => {
    if (!userObj) return { name: 'Unknown', date: '' };
    
    const name = `${userObj.firstname || ''} ${userObj.lastname || ''}`.trim() || userObj.email || 'Unknown';
    const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : '';
    
    return { name, date, id: userObj.id };
  };

  // Extract technical information
  const extractTechnicalInfo = (apiData) => {
    const usage = apiData.usages && apiData.usages[0];
    const attempt = usage && usage.attempts && usage.attempts[0];
    
    return {
      behaviour: usage?.preferredbehaviour || 'Deferred feedback',
      minimumFraction: 0,
      maximumFraction: 1,
      questionVariant: apiData.version || 1,
      questionSummary: (apiData.questiontext || '').replace(/<[^>]*>/g, '').substring(0, 100) || '',
      rightAnswerSummary: attempt?.rightanswer || getRightAnswerSummary(apiData),
      responseSummary: attempt?.response || '',
      questionState: 'todo',
      penalty: apiData.penalty || 0
    };
  };

  // Get right answer summary
  const getRightAnswerSummary = (data) => {
    if (!data.answers) return 'No answers available';
    
    const correctAnswers = data.answers.filter(answer => answer.fraction > 0);
    if (correctAnswers.length === 0) return 'No correct answer defined';
    
    if (data.qtype === 'truefalse') {
      return correctAnswers[0].answer?.replace(/<[^>]*>/g, '') || 'True/False';
    }
    
    return correctAnswers.map(answer => 
      answer.answer?.replace(/<[^>]*>/g, '') || 'Answer'
    ).join(', ');
  };

  // Create fallback preview data
  const createFallbackPreviewData = (questionData) => {
    return {
      id: questionData.id,
      name: questionData.name || questionData.title || `Question ${questionData.id}`,
      questiontext: processHTMLContent(questionData.questiontext || questionData.questionText || ''),
      qtype: questionData.qtype || 'multichoice',
      status: questionData.status || 'draft',
      defaultmark: questionData.defaultmark || 1,
      answers: extractAnswersFromQuestionData(questionData),
      generalfeedback: questionData.generalfeedback || '',
      createdBy: questionData.createdBy || { name: 'Unknown', date: '' },
      modifiedBy: questionData.modifiedBy || { name: 'Unknown', date: '' }
    };
  };

  // Extract answers from question data
  const extractAnswersFromQuestionData = (questionData) => {
    const answers = [];
    
    if (questionData.qtype === 'truefalse') {
      answers.push(
        { id: 'true', text: 'True', isCorrect: questionData.correctAnswer === true },
        { id: 'false', text: 'False', isCorrect: questionData.correctAnswer === false }
      );
    } else if (questionData.choices && Array.isArray(questionData.choices)) {
      questionData.choices.forEach((choice, index) => {
        answers.push({
          id: index,
          text: choice.text || choice.answer || choice,
          isCorrect: choice.isCorrect || false,
          feedback: choice.feedback || ''
        });
      });
    }
    
    return answers;
  };

  // Create fallback technical info
  const createFallbackTechnicalInfo = (questionData) => {
    return {
      behaviour: 'Deferred feedback',
      minimumFraction: 0,
      maximumFraction: 1,
      questionVariant: 1,
      questionSummary: (questionData.questiontext || '').replace(/<[^>]*>/g, '').substring(0, 100) || '',
      rightAnswerSummary: 'See question content',
      responseSummary: '',
      questionState: 'todo'
    };
  };

  // Process HTML content
  const processHTMLContent = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Basic processing - you can expand this for image handling
    return htmlContent;
  };

  // Fetch comments from API
  const fetchComments = async (questionId) => {
    try {
      console.log(`Fetching comments for question: ${questionId}`);
      
      const response = await fetch(`${API_BASE_URL}/questions/comments?questionid=${questionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const commentsData = await response.json();
        console.log(' Comments received:', commentsData);
        
        if (Array.isArray(commentsData)) {
          setComments(commentsData);
        } else if (commentsData.comments && Array.isArray(commentsData.comments)) {
          setComments(commentsData.comments);
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

  // Add comment via API
  const addComment = async () => {
    if (!commentText.trim() || !previewData?.id) return;

    setAddingComment(true);
    try {
      console.log(` Adding comment via API:`, {
        questionid: previewData.id,
        content: commentText,
        userid: currentUser?.id
      });

      const response = await fetch(`${API_BASE_URL}/questions/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionid: previewData.id,
          content: commentText,
          userid: currentUser?.id || 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(' Comment added successfully:', result);
        
        setCommentText('');
        await fetchComments(previewData.id);
        toast.success('Comment added successfully!');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(' Error adding comment:', err);
      
      // Fallback: Add comment to local state
      const newComment = {
        id: Date.now(),
        content: commentText,
        author: currentUser?.username || 'Current User',
        timecreated: Math.floor(Date.now() / 1000),
        user: {
          id: currentUser?.id || '1',
          firstname: currentUser?.firstname || '',
          lastname: currentUser?.lastname || ''
        }
      };
      
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment added locally (API unavailable)');
    } finally {
      setAddingComment(false);
    }
  };

  // Handle answer selection
  const handleAnswerChange = (answerId) => {
    setSelectedAnswer(answerId);
    setQuestionState('answered');
    console.log(` Answer selected: ${answerId}`);
  };

  // Handle action buttons
  const handleStartAgain = () => {
    setSelectedAnswer('');
    setQuestionState('todo');
    toast.success('Question restarted');
  };

  const handleSave = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer first');
      return;
    }
    toast.success('Answer saved');
  };

  const handleFillCorrectResponses = () => {
    if (previewData?.answers) {
      const correctAnswer = previewData.answers.find(answer => answer.isCorrect);
      if (correctAnswer) {
        setSelectedAnswer(correctAnswer.id.toString());
        setQuestionState('correct');
        toast.success('Correct answer filled in');
      } else {
        toast.error('No correct answer found');
      }
    }
  };

  const handleSubmitAndFinish = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer first');
      return;
    }

    const selectedAnswerData = previewData.answers.find(
      answer => answer.id.toString() === selectedAnswer
    );
    
    if (selectedAnswerData?.isCorrect) {
      setQuestionState('correct');
      toast.success(' Correct! Well done.');
    } else {
      setQuestionState('incorrect');
      toast.error(' Incorrect. The correct answer is highlighted.');
    }
  };

  // Helper functions
  const getStatusBadgeStyle = (status) => {
    if (status === 'ready') {
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      };
    }
    return {
      backgroundColor: '#fff3cd',
      color: '#856404',
      border: '1px solid #ffeaa7'
    };
  };

  const getAnswerStyle = (answer, isSelected) => {
    let style = {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      marginBottom: '8px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #dee2e6',
      backgroundColor: '#ffffff'
    };

    if (isSelected) {
      style.backgroundColor = '#e3f2fd';
      style.border = '1px solid #2196f3';
    }

    if (questionState === 'correct' || questionState === 'incorrect') {
      if (answer.isCorrect) {
        style.backgroundColor = '#d4edda';
        style.border = '1px solid #c3e6cb';
        style.color = '#155724';
      } else if (isSelected && !answer.isCorrect) {
        style.backgroundColor = '#f8d7da';
        style.border = '1px solid #f5c6cb';
        style.color = '#721c24';
      }
    }

    return style;
  };

  const formatDate = (timestamp) => {
    try {
      if (timestamp) {
        return new Date(timestamp * 1000).toLocaleString();
      }
      return 'Unknown date';
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Render different question types
  const renderQuestionContent = () => {
    if (!previewData) return null;

    return (
      <div className="moodle-question-content">
        {/* Question Header */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '10px 15px',
          border: '1px solid #dee2e6',
          borderRadius: '4px 4px 0 0',
          borderBottom: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                Version {previewData.version || 1} (latest)
              </span>
              {previewData.name}
            </h3>
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
        <div style={{
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
              <span style={{
                ...getStatusBadgeStyle(previewData.status),
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
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

          {/* Render answers based on question type */}
          {renderAnswersForQuestionType()}
        </div>

        {/* Action Buttons */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          border: '1px solid #dee2e6',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button onClick={handleStartAgain} style={buttonStyle}>Start again</button>
          <button onClick={handleSave} style={buttonStyle}>Save</button>
          <button onClick={handleFillCorrectResponses} style={buttonStyle}>Fill in correct responses</button>
          <button onClick={handleSubmitAndFinish} style={buttonStyle}>Submit and finish</button>
          <button onClick={onRequestClose} style={buttonStyle}>Close preview</button>
        </div>
      </div>
    );
  };

  // Render answers based on question type
  const renderAnswersForQuestionType = () => {
    if (!previewData?.answers) return null;

    const { qtype } = previewData;

    switch (qtype) {
      case 'truefalse':
        return renderTrueFalseAnswers();
      case 'multichoice':
        return renderMultipleChoiceAnswers();
      case 'match':
        return renderMatchingQuestion();
      case 'essay':
        return renderEssayQuestion();
      case 'shortanswer':
        return renderShortAnswerQuestion();
      case 'ddimageortext':
        return renderDragDropQuestion();
      case 'ddwtos':
        return renderDragDropIntoTextQuestion();
      case 'ddmarker':
        return renderDragDropMarkersQuestion();
      case 'gapselect':
        return renderGapSelectQuestion();
      default:
        return renderGenericQuestion();
    }
  };

  // Render True/False answers
  const renderTrueFalseAnswers = () => (
    <div className="answer-options">
      <div style={{ marginBottom: '12px', fontWeight: '500' }}>Select one:</div>
      {previewData.answers.map((answer) => {
        const cleanAnswer = answer.text.replace(/<[^>]*>/g, '');
        const isSelected = selectedAnswer === answer.id.toString();
        
        return (
          <div
            key={answer.id}
            style={getAnswerStyle(answer, isSelected)}
            onClick={() => handleAnswerChange(answer.id.toString())}
          >
            <input
              type="radio"
              name={`question_${previewData.id}`}
              value={answer.id}
              checked={isSelected}
              onChange={() => handleAnswerChange(answer.id.toString())}
              style={{ marginRight: '8px' }}
            />
            {cleanAnswer}
            {(questionState === 'correct' || questionState === 'incorrect') && answer.isCorrect && (
              <span style={{ marginLeft: '8px', color: '#155724', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Multiple Choice answers
  const renderMultipleChoiceAnswers = () => (
    <div className="answer-options">
      <div style={{ marginBottom: '12px', fontWeight: '500' }}>Select one:</div>
      {previewData.answers.map((answer, index) => {
        const isSelected = selectedAnswer === answer.id.toString();
        const optionLabel = String.fromCharCode(97 + index); // a, b, c, d
        
        return (
          <div
            key={answer.id}
            style={getAnswerStyle(answer, isSelected)}
            onClick={() => handleAnswerChange(answer.id.toString())}
          >
            <input
              type="radio"
              name={`question_${previewData.id}`}
              value={answer.id}
              checked={isSelected}
              onChange={() => handleAnswerChange(answer.id.toString())}
              style={{ marginRight: '8px' }}
            />
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{optionLabel}.</span>
            <div dangerouslySetInnerHTML={{ __html: answer.text }} />
            {(questionState === 'correct' || questionState === 'incorrect') && answer.isCorrect && (
              <span style={{ marginLeft: '8px', color: '#155724', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Matching Question
  const renderMatchingQuestion = () => (
    <div className="answer-options">
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
          This is a drag-and-drop matching question. In the actual quiz, you would drag items to match them correctly.
        </p>
        {previewData.matchSubquestions && previewData.matchSubquestions.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <strong>Matching pairs available in this question.</strong>
          </div>
        )}
      </div>
    </div>
  );

  // Render Essay Question
  const renderEssayQuestion = () => (
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
  );

  // Render Short Answer Question
  const renderShortAnswerQuestion = () => (
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
  );

  // Render Drag and Drop Question
  const renderDragDropQuestion = () => (
    <div className="answer-options">
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
          This is a drag-and-drop question. In the actual quiz, you would drag items to the appropriate drop zones.
        </p>
      </div>
    </div>
  );

  // Render Drag and Drop Into Text Question (ddwtos)
  const renderDragDropIntoTextQuestion = () => {
    // Get drag items from the processed data
    const dragItems = previewData.dragItems || previewData.answers || [];
    
    console.log(' DDWTOS Debug:', {
      dragItems,
      answers: previewData.answers,
      drags: previewData.drags,
      qtype: previewData.qtype
    });
    
    // Process the question text to identify gaps and create interactive elements
    const processQuestionTextWithGaps = () => {
      let questionText = previewData.questiontext;
      
      // Replace [[1]], [[2]], etc. with interactive drop zones
      const gapPattern = /\[\[(\d+)\]\]/g;
      let gapIndex = 0;
      
      questionText = questionText.replace(gapPattern, (match, groupNumber) => {
        gapIndex++;
        const gapId = `gap_${gapIndex}`;
        
        return `<span class="drag-drop-gap" data-gap="${groupNumber}" data-gap-id="${gapId}" style="
          display: inline-block;
          min-width: 100px;
          min-height: 30px;
          border: 2px dashed #007bff;
          border-radius: 4px;
          margin: 0 4px;
          padding: 4px 8px;
          background-color: #f8f9ff;
          vertical-align: middle;
          position: relative;
          cursor: pointer;
        " title="Drop zone ${gapIndex}">
          <span style="color: #6c757d; font-size: 12px;">Drop here ${gapIndex}</span>
        </span>`;
      });
      
      return questionText;
    };

    return (
      <div className="answer-options">
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b8daff',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#004085'
          }}>
             Drag and Drop into Text Question
          </h5>
          <p style={{ 
            margin: '0 0 10px 0', 
            fontSize: '14px', 
            color: '#004085' 
          }}>
            In the actual quiz, drag the words below into the correct gaps in the text above.
          </p>
        </div>

        {/* Enhanced Question Text with Interactive Gaps */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          fontSize: '16px',
          lineHeight: '1.8'
        }}>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: processQuestionTextWithGaps() 
            }}
          />
        </div>

        {/* Debug Information */}
        {/* <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '15px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong> Debug Info:</strong> Found {dragItems.length} drag items
          {dragItems.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              Items: {dragItems.map(item => `"${item.label || item.text || item.answer || 'Unknown'}"`).join(', ')}
            </div>
          )}
        </div> */}

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
             Draggable Words/Phrases ({dragItems.length} items)
          </h6>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '10px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            minHeight: '80px'
          }}>
            {dragItems.length > 0 ? dragItems.map((item, index) => {
              // Get the text content from multiple possible fields
              const itemText = item.label || item.text || item.answer || `Item ${index + 1}`;
              
              // Extract drag group info from feedback if available
              let dragGroup = 1;
              let isInfinite = false;
              
              try {
                // Parse the feedback which contains drag group info
                const feedbackText = item.feedback?.replace(/<[^>]*>/g, '') || '';
                if (feedbackText.includes('draggroup')) {
                  // This is a simplified parser - you might need to adjust based on your data
                  const groupMatch = feedbackText.match(/"draggroup";s:\d+:"(\d+)"/);
                  if (groupMatch) dragGroup = parseInt(groupMatch[1]);
                  
                  isInfinite = feedbackText.includes('"infinite";b:1');
                }
              } catch (e) {
                console.warn('Could not parse drag group info:', e);
              }

              return (
                <div
                  key={item.id || index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #007bff',
                    borderRadius: '6px',
                    cursor: 'grab',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#007bff',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                    minWidth: '60px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    e.target.style.backgroundColor = '#e3f2fd';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                  title={`Drag item: ${itemText}\nGroup: ${dragGroup}${isInfinite ? ' (infinite use)' : ''}`}
                >
                  <span>{itemText}</span>
                  {isInfinite && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      ∞
                    </span>
                  )}
                </div>
              );
            }) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6c757d',
                fontStyle: 'italic',
                width: '100%'
              }}>
                 No drag items found. Check if the question data contains answers or drags array.
              </div>
            )}
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            Tip: Items with ∞ symbol can be used multiple times
          </div>
        </div>

        {/* Instructions */}
        {/* <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '12px',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong> Instructions:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0' }}>
            <li>Drag words from the box below into the correct gaps in the text above</li>
            <li>Each gap accepts specific words that make the sentence meaningful</li>
            <li>Some words can be used multiple times (marked with ∞)</li>
            <li>In the actual quiz, you can drag and drop interactively</li>
          </ul>
        </div> */}

        {/* Show Answer Key (for preview purposes) */}
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
               Show Answer Information (Preview Only)
            </summary>
            <div style={{ marginTop: '10px' }}>
              <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#004085', marginBottom: '10px' }}>
                Available Drag Items:
              </h6>
              {dragItems.map((item, index) => (
                <div key={item.id || index} style={{
                  fontSize: '12px',
                  color: '#495057',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  border: '1px solid #e9ecef'
                }}>
                  <div><strong>Text:</strong> "{item.label || item.text || item.answer || 'Unknown'}"</div>
                  <div><strong>ID:</strong> {item.id || index}</div>
                  <div><strong>Type:</strong> {item.answerformat === 1 ? 'HTML' : 'Plain text'}</div>
                </div>
              ))}
              
              {/* Show original API data for debugging */}
              <div style={{ marginTop: '15px' }}>
                <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#004085', marginBottom: '5px' }}>
                  Raw API Data:
                </h6>
                <details style={{ fontSize: '11px' }}>
                  <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                    Show Raw Data (for debugging)
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    marginTop: '5px'
                  }}>
                    {JSON.stringify({
                      answers: previewData.originalApiData?.answers,
                      drags: previewData.originalApiData?.drags,
                      qtype: previewData.qtype
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </details>
        </div>
      </div>
    );
  };

  // Render Gap Select Question (similar to ddwtos but with dropdowns)
  const renderGapSelectQuestion = () => (
    <div className="answer-options">
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '15px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
          <strong> Gap Select Question:</strong>
        </p>
        <p style={{ margin: '0' }}>
          This is a gap-select question where you choose words from dropdown menus to fill in the blanks.
        </p>
      </div>
    </div>
  );

  // Button style
  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  };

  if (loading) {
    return (
      <ReactModal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Question Preview"
        style={{
          overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          content: {
            maxWidth: '800px',
            margin: 'auto',
            top: '10%',
            padding: '40px',
            textAlign: 'center'
          }
        }}
      >
        <div style={{ fontSize: '18px', color: '#6c757d' }}>
           Loading preview data from API...
        </div>
      </ReactModal>
    );
  }

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
          width: '1000px',
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
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
    >
      <div className="moodle-preview-container">
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
              Using fallback question data...
            </div>
          </div>
        )}

        {/* Main Question Content */}
        {!loading && previewData && renderQuestionContent()}

        {/* Comments Section */}
        {!loading && (
          <div style={{ marginTop: '20px' }}>
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
                  {comments.length > 0 ? (
                    <div style={{ marginBottom: '15px' }}>
                      {comments.map((comment, index) => {
                        const userInfo = comment.user || {};
                        const author = userInfo.firstname && userInfo.lastname 
                          ? `${userInfo.firstname} ${userInfo.lastname}`.trim()
                          : comment.author || comment.username || 'Unknown User';
                        
                        return (
                          <div key={comment.id || index} style={{
                            marginBottom: '12px',
                            paddingBottom: '12px',
                            borderBottom: index < comments.length - 1 ? '1px solid #e9ecef' : 'none'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              fontSize: '14px',
                              marginBottom: '4px',
                              color: '#495057'
                            }}>
                               {author}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d',
                              marginBottom: '8px' 
                            }}>
                               {formatDate(comment.timecreated)}
                            </div>
                            <div style={{ fontSize: '14px' }}>
                              {comment.content || comment.text || comment.comment}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ 
                      marginBottom: '15px', 
                      fontSize: '14px', 
                      color: '#6c757d', 
                      fontStyle: 'italic' 
                    }}>
                       No comments yet.
                    </div>
                  )}
                  
                  <div>
                    {currentUser && (
                      <div style={{ 
                        marginBottom: '8px', 
                        fontSize: '13px', 
                        color: '#6c757d'
                      }}>
                        Commenting as: <strong> {currentUser.username}</strong>
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
                      onClick={addComment}
                      disabled={addingComment || !commentText.trim()}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: addingComment ? '#6c757d' : (commentText.trim() ? '#007bff' : '#6c757d'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: addingComment || !commentText.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {addingComment ? ' Saving...' : 'Save comment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Options */}
        {!loading && (
          <div style={{ marginTop: '20px' }}>
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
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Question version
                    </label>
                    <select style={{
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px'
                    }}>
                      <option value="latest">Always latest</option>
                      <option value="version1">Version 1</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      How questions behave
                    </label>
                    <select style={{
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px'
                    }}>
                      <option value="deferred">Deferred feedback</option>
                      <option value="immediate">Immediate feedback</option>
                      <option value="interactive">Interactive with multiple tries</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Marked out of
                    </label>
                    <input
                      type="number"
                      defaultValue={previewData?.defaultmark || 1}
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
                    onClick={() => toast.info(' Preview options updated!')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Save preview options and start again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display Options */}
        {!loading && (
          <div style={{ marginTop: '20px' }}>
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
                    { label: 'Whether correct', key: 'showCorrect' },
                    { label: 'Marks', key: 'marks' },
                    { label: 'Specific feedback', key: 'specificFeedback' },
                    { label: 'General feedback', key: 'generalFeedback' },
                    { label: 'Right answer', key: 'rightAnswer' },
                    { label: 'Response history', key: 'responseHistory' }
                  ].map((option, index) => (
                    <div key={index} style={{ 
                      marginBottom: '15px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <label style={{ fontWeight: '500', minWidth: '120px' }}>
                        {option.label}
                      </label>
                      <select style={{
                        padding: '6px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '150px'
                      }}>
                        <option value="shown">Shown</option>
                        <option value="not_shown">Not shown</option>
                        {option.key === 'marks' && <option value="show_mark_and_max">Show mark and max</option>}
                      </select>
                    </div>
                  ))}

                  <button
                    onClick={() => toast.info(' Display options updated!')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                     Update display options
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Information */}
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
                <div style={{ marginBottom: '8px' }}>
                  <strong>Question state:</strong> {technicalInfo.questionState}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>API Status:</strong> <span style={{ color: error ? '#dc3545' : '#28a745' }}>
                    {error ? ' API Error (using fallback)' : ' Connected'}
                  </span>
                </div>
                <div>
                  <strong>Endpoint:</strong> {API_BASE_URL}/questions/preview?questionid={previewData.id}
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
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    console.log(' Downloading question XML...');
                    
                    const response = await fetch(`${API_BASE_URL}/questions/export?questionid=${previewData.id}&format=xml`, {
                      method: 'GET',
                      headers: getAuthHeaders()
                    });
                    
                    if (response.ok) {
                      const xmlContent = await response.text();
                      const blob = new Blob([xmlContent], { type: 'application/xml' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `question_${previewData.id}.xml`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast.success(' XML file downloaded successfully!');
                    } else {
                      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                  } catch (err) {
                    console.error(' Download failed:', err);
                    toast.error(' Download failed: ' + err.message);
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
};

export default QuestionPreviewFilter;