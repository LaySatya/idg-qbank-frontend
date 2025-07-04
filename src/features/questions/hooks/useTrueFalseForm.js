// ============================================================================
// 📁 src/components/questions/hooks/useTrueFalseForm.js
// ============================================================================
import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_TRUE_FALSE_QUESTION } from '../../../shared/constants/questionConstants';
import { useAPITags } from './useAPIData';
import { questionAPI } from '../../../api/questionAPI';

export const useTrueFalseForm = (initialQuestion = null) => {
  const { tags: availableTags, loading: tagsLoading, error: tagsError } = useAPITags();
  
  const [question, setQuestion] = useState({
    ...DEFAULT_TRUE_FALSE_QUESTION,
    ...initialQuestion
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const updateField = useCallback((field, value) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleTagToggle = useCallback((tag) => {
    setQuestion(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!question.title.trim()) newErrors.title = "Question name is required";
    if (!question.questionText.trim()) newErrors.questionText = "Question text is required";
    if (question.defaultMark <= 0) newErrors.defaultMark = "Default mark must be greater than 0";
    if (question.tags.length === 0) newErrors.tags = "At least one tag is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [question]);

  const saveQuestion = useCallback(async () => {
    if (!validate()) {
      console.warn(' Validation failed');
      return false;
    }

    try {
      setSaving(true);
      console.log(' Saving True/False question:', question);
      
      const result = await questionAPI.createTrueFalseQuestion(question);
      console.log(' Question saved successfully:', result);
      
      alert('Question saved successfully!');
      return true;
    } catch (error) {
      console.error(' Failed to save question:', error);
      alert(`Failed to save question: ${error.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [question, validate]);

  const resetForm = useCallback((newQuestion = null) => {
    setQuestion({
      ...DEFAULT_TRUE_FALSE_QUESTION,
      ...newQuestion
    });
    setErrors({});
  }, []);

  useEffect(() => {
    if (initialQuestion) {
      resetForm(initialQuestion);
    }
  }, [initialQuestion, resetForm]);

  return {
    question,
    errors,
    availableTags,
    tagsLoading,
    tagsError,
    saving,
    updateField,
    handleTagToggle,
    validate,
    saveQuestion,
    resetForm
  };
};
