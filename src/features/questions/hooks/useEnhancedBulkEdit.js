// ============================================================================
// components/questions/hooks/useEnhancedBulkEdit.js - NEW ENHANCED VERSION
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
// import { DEFAULT_CHOICES } from '../constants/questionConstants';
import { DEFAULT_CHOICES } from '../../../components/constants/questionConstants';

// Helper function to create fresh choices for bulk edit
const createFreshBulkChoices = (choices, questionIndex) => {
  if (!choices || choices.length === 0) {
    return DEFAULT_CHOICES.map((choice, choiceIndex) => ({
      id: `bulk-choice-${questionIndex}-${choiceIndex}-${Date.now()}`,
      text: '',
      answer: '', // Ensure both fields exist
      grade: 'None',
      feedback: ''
    }));
  }
  
  return choices.map((choice, choiceIndex) => ({
    id: choice.id || `bulk-choice-${questionIndex}-${choiceIndex}-${Date.now()}`,
    text: choice.text || choice.answer || '', // Support both formats
    answer: choice.text || choice.answer || '', // Ensure both fields exist
    grade: choice.grade || choice.fraction || 'None',
    feedback: choice.feedback || '',
    isCorrect: choice.isCorrect || (choice.grade && parseFloat(choice.grade) > 0) || false
  }));
};

export const useEnhancedBulkEdit = (questionsToEdit, isBulk) => {
    // State to hold the processed bulk questions
  // console.log("Questions passed to bulk edit:", questionsToEdit);
  // console.log("Questions passed to bulk edit (full):", JSON.stringify(questionsToEdit, null, 2));
        
        
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkTagDropdowns, setBulkTagDropdowns] = useState({});
  
  // New: Global bulk changes that apply to all questions
  const [globalBulkChanges, setGlobalBulkChanges] = useState({
    status: '',
    defaultMark: '',
    category: '',
    version: '',
    modifiedBy: '',
    tags: { add: [], remove: [] },
    feedbackCorrect: '',
    feedbackIncorrect: '',
    generalFeedback: '',
    penaltyFactor: '',
    showInstructions: null // null means no change, true/false for actual values
  });

  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    // console.log('useEnhancedBulkEdit: Processing questions', questionsToEdit, 'isBulk:', isBulk);

    if (isBulk && questionsToEdit) {
      const processedQuestions = questionsToEdit.map((q, index) => ({
        ...q,
        id: q.id || `bulk-question-${index}-${Date.now()}`,
        title: q.title || '',
        questionText: q.questionText || '',
        questionStatus: q.questionStatus || 'Ready',
        defaultMark: q.defaultMark ?? 100,
        idNumber: q.idNumber || '',
        qtype: q.qtype || 'multichoice',
        generalFeedback: q.generalFeedback || '',
        multipleAnswers: q.multipleAnswers ?? false,
        shuffleAnswers: q.shuffleAnswers ?? true,
        numberChoices: q.numberChoices || '1, 2, 3, ...',
        showInstructions: q.showInstructions ?? false,
        choices: (q.choices && q.choices.length > 0)
    ? createFreshBulkChoices(q.choices, index)
    : (q.answers && q.answers.length > 0)
      ? createFreshBulkChoices(q.answers, index)
      : createFreshBulkChoices([], index),
        tags: q.tags ? [...q.tags] : [],
        category: q.category || '',
        version: q.version || 'v1',
        modifiedBy: q.modifiedBy || '',
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

  // Calculate pending changes for preview
  useEffect(() => {
    if (!bulkQuestions.length) return;

    const changes = {};
    
    if (globalBulkChanges.status) {
      const affectedCount = bulkQuestions.filter(q => q.questionStatus !== globalBulkChanges.status).length;
      if (affectedCount > 0) {
        changes.status = `Will update status for ${affectedCount} question(s) to "${globalBulkChanges.status}"`;
      }
    }
    
    if (globalBulkChanges.defaultMark) {
      const newMark = parseInt(globalBulkChanges.defaultMark);
      const affectedCount = bulkQuestions.filter(q => q.defaultMark !== newMark).length;
      if (affectedCount > 0) {
        changes.defaultMark = `Will update default mark for ${affectedCount} question(s) to ${newMark}`;
      }
    }
    
    if (globalBulkChanges.category) {
      const affectedCount = bulkQuestions.filter(q => q.category !== globalBulkChanges.category).length;
      if (affectedCount > 0) {
        changes.category = `Will move ${affectedCount} question(s) to new category`;
      }
    }

    if (globalBulkChanges.tags.add.length > 0) {
      changes.tagsAdd = `Will add ${globalBulkChanges.tags.add.length} tag(s) to all questions`;
    }
    
    if (globalBulkChanges.tags.remove.length > 0) {
      changes.tagsRemove = `Will remove ${globalBulkChanges.tags.remove.length} tag(s) from all questions`;
    }

    if (globalBulkChanges.feedbackCorrect) {
      changes.feedbackCorrect = `Will update correct feedback for all questions`;
    }

    if (globalBulkChanges.feedbackIncorrect) {
      changes.feedbackIncorrect = `Will update incorrect feedback for all questions`;
    }

    if (globalBulkChanges.generalFeedback) {
      changes.generalFeedback = `Will update general feedback for all questions`;
    }

    if (globalBulkChanges.penaltyFactor) {
      const newPenalty = parseFloat(globalBulkChanges.penaltyFactor);
      const affectedCount = bulkQuestions.filter(q => q.penaltyFactor !== newPenalty).length;
      if (affectedCount > 0) {
        changes.penaltyFactor = `Will update penalty factor for ${affectedCount} question(s)`;
      }
    }

    if (globalBulkChanges.showInstructions !== null) {
      const affectedCount = bulkQuestions.filter(q => q.showInstructions !== globalBulkChanges.showInstructions).length;
      if (affectedCount > 0) {
        changes.showInstructions = `Will ${globalBulkChanges.showInstructions ? 'enable' : 'disable'} instructions for ${affectedCount} question(s)`;
      }
    }

    setPendingChanges(changes);
  }, [globalBulkChanges, bulkQuestions]);

  // Apply global bulk changes to all questions
  const applyGlobalBulkChanges = useCallback(() => {
    setBulkQuestions(prev => 
      prev.map(question => {
        const updatedQuestion = { ...question };
        
        // Apply basic field changes
        if (globalBulkChanges.status) updatedQuestion.questionStatus = globalBulkChanges.status;
        if (globalBulkChanges.defaultMark) updatedQuestion.defaultMark = parseInt(globalBulkChanges.defaultMark);
        if (globalBulkChanges.category) updatedQuestion.category = globalBulkChanges.category;
        if (globalBulkChanges.version) updatedQuestion.version = globalBulkChanges.version;
        if (globalBulkChanges.modifiedBy) updatedQuestion.modifiedBy = globalBulkChanges.modifiedBy;
        if (globalBulkChanges.generalFeedback) updatedQuestion.generalFeedback = globalBulkChanges.generalFeedback;
        if (globalBulkChanges.penaltyFactor) updatedQuestion.penaltyFactor = parseFloat(globalBulkChanges.penaltyFactor);
        if (globalBulkChanges.showInstructions !== null) updatedQuestion.showInstructions = globalBulkChanges.showInstructions;
        
        // Apply feedback changes
        if (globalBulkChanges.feedbackCorrect || globalBulkChanges.feedbackIncorrect) {
          updatedQuestion.combinedFeedback = {
            ...updatedQuestion.combinedFeedback,
            ...(globalBulkChanges.feedbackCorrect && { correct: globalBulkChanges.feedbackCorrect }),
            ...(globalBulkChanges.feedbackIncorrect && { incorrect: globalBulkChanges.feedbackIncorrect })
          };
        }
        
        // Apply tag changes
        let newTags = [...updatedQuestion.tags];
        
        // Add tags
        globalBulkChanges.tags.add.forEach(tag => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });
        
        // Remove tags
        globalBulkChanges.tags.remove.forEach(tag => {
          newTags = newTags.filter(t => t !== tag);
        });
        
        updatedQuestion.tags = newTags;
        
        return updatedQuestion;
      })
    );
    
    // Reset global bulk changes
    setGlobalBulkChanges({
      status: '',
      defaultMark: '',
      category: '',
      version: '',
      modifiedBy: '',
      tags: { add: [], remove: [] },
      feedbackCorrect: '',
      feedbackIncorrect: '',
      generalFeedback: '',
      penaltyFactor: '',
      showInstructions: null
    });
  }, [globalBulkChanges]);

  // Handle global bulk field changes
  const handleGlobalBulkChange = useCallback((field, value) => {
    setGlobalBulkChanges(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle tag operations for global bulk changes
  const handleGlobalTagOperation = useCallback((operation, tag) => {
    setGlobalBulkChanges(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [operation]: prev.tags[operation].includes(tag)
          ? prev.tags[operation].filter(t => t !== tag)
          : [...prev.tags[operation], tag]
      }
    }));
  }, []);

  // Individual question editing (existing functionality)
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
                answer: '', // <-- make sure this is present!
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
    // Existing functionality
    bulkQuestions,
    bulkTagDropdowns,
    handleBulkChange,
    handleBulkChoiceChange,
    handleBulkTagToggle,
    toggleBulkTagDropdown,
    handleBulkAddChoice,
    handleBulkRemoveChoice,
    
    // New global bulk edit functionality
    globalBulkChanges,
    pendingChanges,
    handleGlobalBulkChange,
    handleGlobalTagOperation,
    applyGlobalBulkChanges
  };
};