// ============================================================================
// components/questions/hooks/useBulkEdit.js - FIXED
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_CHOICES } from '../constants/questionConstants';

// Helper function to create fresh choices for bulk edit
const createFreshBulkChoices = (choices, questionIndex) => {
  if (!choices || choices.length === 0) {
    return DEFAULT_CHOICES.map((choice, choiceIndex) => ({
      id: `bulk-choice-${questionIndex}-${choiceIndex}-${Date.now()}`,
      text: '',
      grade: 'None',
      feedback: ''
    }));
  }
  
  return choices.map((choice, choiceIndex) => ({
    id: choice.id || `bulk-choice-${questionIndex}-${choiceIndex}-${Date.now()}`,
    text: choice.text || '',
    grade: choice.grade || 'None',
    feedback: choice.feedback || ''
  }));
};

export const useBulkEdit = (questionsToEdit, isBulk) => {
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkTagDropdowns, setBulkTagDropdowns] = useState({});

  useEffect(() => {
    console.log('useBulkEdit: Processing questions', questionsToEdit, 'isBulk:', isBulk);

    if (isBulk && questionsToEdit) {
      const processedQuestions = questionsToEdit.map((q, index) => ({
        ...q,
        id: q.id || `bulk-question-${index}-${Date.now()}`,
        title: q.title || '',
        questionText: q.questionText || '',
        questionStatus: q.questionStatus || 'Ready',
        defaultMark: q.defaultMark ?? 100,
        idNumber: q.idNumber || '',
        generalFeedback: q.generalFeedback || '',
        multipleAnswers: q.multipleAnswers ?? false,
        shuffleAnswers: q.shuffleAnswers ?? true,
        numberChoices: q.numberChoices || '1, 2, 3, ...',
        showInstructions: q.showInstructions ?? false,
        choices: createFreshBulkChoices(q.choices, index),
        tags: q.tags ? [...q.tags] : [],
        combinedFeedback: q.combinedFeedback ? {
          correct: q.combinedFeedback.correct || 'Your answer is correct.',
          partiallyCorrect: q.combinedFeedback.partiallyCorrect || 'Your answer is partially correct.',
          incorrect: q.combinedFeedback.incorrect || 'Your answer is incorrect.',
          showNumberCorrect: q.combinedFeedback.showNumberCorrect ?? false
        } : {
          correct: 'Your answer is correct.',
          partiallyCorrect: 'Your answer is partially correct.',
          incorrect: 'Your answer is incorrect.',
          showNumberCorrect: false
        },
        penaltyFactor: q.penaltyFactor ?? 0,
        hint1: q.hint1 || '',
        hint1ClearIncorrect: q.hint1ClearIncorrect ?? false,
        hint1ShowNumCorrect: q.hint1ShowNumCorrect ?? false,
        hint2: q.hint2 || '',
        hint2ClearIncorrect: q.hint2ClearIncorrect ?? false,
        hint2ShowNumCorrect: q.hint2ShowNumCorrect ?? false
      }));
      
      console.log('Processed bulk questions:', processedQuestions);
      setBulkQuestions(processedQuestions);
    } else {
      setBulkQuestions([]);
    }
  }, [questionsToEdit, isBulk]);

  const handleBulkChange = useCallback((idx, field, value) => {
    setBulkQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  }, []);

  const handleBulkChoiceChange = useCallback((qIdx, cIdx, field, value) => {
    setBulkQuestions(prev =>
      prev.map((question, questionIndex) => {
        if (questionIndex !== qIdx) return question;
        
        const newChoices = question.choices.map((choice, choiceIndex) =>
          choiceIndex === cIdx 
            ? { ...choice, [field]: value }
            : choice
        );
        
        return {
          ...question,
          choices: newChoices
        };
      })
    );
  }, []);

  const handleBulkTagToggle = useCallback((idx, tag) => {
    setBulkQuestions(prev =>
      prev.map((q, i) =>
        i === idx
          ? {
              ...q,
              tags: q.tags && q.tags.includes(tag)
                ? q.tags.filter(t => t !== tag)
                : [...(q.tags || []), tag]
            }
          : q
      )
    );
  }, []);

  const toggleBulkTagDropdown = useCallback((idx) => {
    setBulkTagDropdowns(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  }, []);

  const handleBulkAddChoice = useCallback((qIdx) => {
    setBulkQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { 
              ...q, 
              choices: [
                ...q.choices, 
                { 
                  id: `new-bulk-choice-${qIdx}-${q.choices.length}-${Date.now()}`,
                  text: '', 
                  grade: 'None', 
                  feedback: '' 
                }
              ] 
            }
          : q
      )
    );
  }, []);

  const handleBulkRemoveChoice = useCallback((qIdx, cIdx) => {
    setBulkQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx && q.choices.length > 2
          ? { ...q, choices: q.choices.filter((_, idx) => idx !== cIdx) }
          : q
      )
    );
  }, []);

  return {
    bulkQuestions,
    bulkTagDropdowns,
    handleBulkChange,
    handleBulkChoiceChange,
    handleBulkTagToggle,
    toggleBulkTagDropdown,
    handleBulkAddChoice,
    handleBulkRemoveChoice
  };
};
