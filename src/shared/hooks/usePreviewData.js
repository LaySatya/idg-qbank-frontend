// ============================================================================
// hooks/usePreviewData.js - Custom hook for preview data management
// ============================================================================
import { useState } from 'react';

import { processHTMLContent } from '../utils/htmlProcessor';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const usePreviewData = () => {
  const [previewData, setPreviewData] = useState(null);
  const [technicalInfo, setTechnicalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Extract context ID from API data
  const extractContextId = (apiData) => {
    if (apiData.usages && apiData.usages.length > 0) {
      const contextId = apiData.usages[0].contextid;
      if (contextId) {
        console.log(` Found context ID from usages: ${contextId}`);
        return contextId;
      }
    }
    
    if (apiData.drags && apiData.drags.length > 0) {
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
    
    console.log(` Using default context ID: 1`);
    return '1';
  };

  // Extract user information
  const extractUserInfo = (userObj, timestamp) => {
    if (!userObj) return { name: 'Unknown', date: '' };
    
    const name = `${userObj.firstname || ''} ${userObj.lastname || ''}`.trim() || userObj.email || 'Unknown';
    const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : '';
    
    return { name, date, id: userObj.id };
  };

  // Extract drag items for ddwtos questions
  const extractDragItemsForDdwtos = (apiData) => {
    if (apiData.qtype === 'ddwtos') {
      if (apiData.answers && Array.isArray(apiData.answers)) {
        return apiData.answers.map((answer, index) => ({
          id: answer.id || index,
          no: index + 1,
          label: answer.answer || answer.text || `Item ${index + 1}`,
          text: answer.answer || answer.text || `Item ${index + 1}`,
          infinite: false,
          draggroup: 1,
          noofdrags: 1,
          feedback: answer.feedback
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
      answer: answer.answer || answer.text || '',
      isCorrect: answer.fraction > 0,
      feedback: answer.feedback || '',
      fraction: answer.fraction || 0,
      answerformat: answer.answerformat || 1
    }));
  };

  // Get right answer summary
  const getRightAnswerSummary = (data) => {
    if (data.qtype === 'match' && data.match_subquestions) {
      const pairs = data.match_subquestions
        .filter(sq => sq.questiontext && sq.answertext)
        .map(sq => {
          const question = sq.questiontext.replace(/<[^>]*>/g, '').trim();
          const answer = sq.answertext.replace(/<[^>]*>/g, '').trim();
          return `${question} → ${answer}`;
        });
      return pairs.length > 0 ? pairs.join('; ') : 'Matching pairs available';
    }
    
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

  // Process API preview data
  const processAPIPreviewData = (apiData, questionId) => {
    const contextId = extractContextId(apiData);
    
    const processedData = {
      id: questionId,
      name: apiData.name || `Question ${questionId}`,
      questiontext: processHTMLContent(apiData.questiontext || '', questionId, contextId),
      qtype: apiData.qtype || 'multichoice',
      status: apiData.status || 'draft',
      defaultmark: apiData.defaultmark || 1,
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
      contextId: contextId,
      
      // For ddwtos questions, extract drag items from answers if drags array is empty
      dragItems: extractDragItemsForDdwtos(apiData),
      
      // Store original API data for reference
      originalApiData: apiData
    };

    return processedData;
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

  // Main fetch function
  const fetchPreviewData = async (questionId, fallbackQuestion) => {
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
      if (fallbackQuestion) {
        const fallbackData = createFallbackPreviewData(fallbackQuestion);
        setPreviewData(fallbackData);
        setTechnicalInfo(createFallbackTechnicalInfo(fallbackQuestion));
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset state
  const resetPreviewData = () => {
    setPreviewData(null);
    setTechnicalInfo(null);
    setError(null);
    setLoading(false);
  };

  return {
    previewData,
    technicalInfo,
    loading,
    error,
    fetchPreviewData,
    resetPreviewData,
    setPreviewData,
    setTechnicalInfo
  };
};