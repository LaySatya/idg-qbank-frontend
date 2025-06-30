// components/questions/hooks/useBulkTrueFalseEdit.js
import { useState, useCallback } from 'react';
import { DEFAULT_TRUE_FALSE_QUESTION } from '../../../components/constants/questionConstants';

export const useBulkTrueFalseEdit = (questionsToEdit, isBulk) => {
  const [bulkQuestions, setBulkQuestions] = useState(
    isBulk
      ? questionsToEdit.map(q => ({
          ...DEFAULT_TRUE_FALSE_QUESTION,
          ...q
        }))
      : []
  );

  const [bulkTagDropdowns, setBulkTagDropdowns] = useState({});

  const handleBulkChange = useCallback((idx, field, value) => {
    setBulkQuestions(prev =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  }, []);

  const handleBulkTagToggle = useCallback((idx, tag) => {
    setBulkQuestions(prev =>
      prev.map((q, i) =>
        i === idx ? {
          ...q,
          tags: q.tags.includes(tag) 
            ? q.tags.filter(t => t !== tag)
            : [...q.tags, tag]
        } : q
      )
    );
  }, []);

  const toggleBulkTagDropdown = useCallback((idx) => {
    setBulkTagDropdowns(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  }, []);

  return {
    bulkQuestions,
    bulkTagDropdowns,
    handleBulkChange,
    handleBulkTagToggle,
    toggleBulkTagDropdown
  };
};