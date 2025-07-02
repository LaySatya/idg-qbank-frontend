
// ============================================================================
// 📁 src/components/questions/hooks/useMultipleChoiceForm.js
// ============================================================================
import { useState, useCallback, useEffect } from 'react';
// import { DEFAULT_MULTIPLE_CHOICE_QUESTION, DEFAULT_CHOICES } from '../../../co/constants/questionConstants';
import { DEFAULT_MULTIPLE_CHOICE_QUESTION , DEFAULT_CHOICES } from '../../../components/constants/questionConstants';

import { useAPITags } from './useAPIData';
import { questionAPI } from '../../../api/questionAPI';

// Helper function to create fresh choices
const createFreshChoices = (choices) => {
  if (!choices || choices.length === 0) {
    return DEFAULT_CHOICES.map((choice, index) => ({
      id: `fresh-choice-${Date.now()}-${index}`,
      text: '',
      answer: '',
      grade: 'None',
      feedback: ''
    }));
  }
  
  return choices.map((choice, index) => ({
    id: choice.id || `choice-${Date.now()}-${index}`,
    text: choice.text || '',
    answer: choice.text || '',
    grade: choice.grade || 'None',
    feedback: choice.feedback || ''
  }));
};

export const useMultipleChoiceForm = (initialQuestion = {}) => {
  const { tags: availableTags, loading: tagsLoading, error: tagsError } = useAPITags();
  
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_MULTIPLE_CHOICE_QUESTION,
    ...initialQuestion,
    choices: createFreshChoices(initialQuestion.choices)
  }));

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const updateChoice = useCallback((index, field, value) => {
    setFormData(prev => {
      const newChoices = prev.choices.map((choice, i) => 
        i === index 
          ? { ...choice, [field]: value, answer: field === 'text' ? value : choice.answer }
          : choice
      );
      return { ...prev, choices: newChoices };
    });
  }, []);

  const addChoice = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      choices: [
        ...prev.choices,
        {
          id: Date.now(),
          text: '',
          answer: '',
          grade: 'None',
          feedback: ''
        }
      ]
    }));
  }, []);

  const removeChoice = useCallback((index) => {
    setFormData(prev => {
      if (prev.choices.length <= 2) return prev;
      return {
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index)
      };
    });
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Question name is required';
    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required';
    if (!formData.tags || formData.tags.length === 0) newErrors.tags = 'At least one tag is required';
    if (formData.defaultMark <= 0) newErrors.defaultMark = 'Default mark must be greater than 0';

    // Per-choice validation
    const choiceErrors = formData.choices.map((choice, idx) => {
      if (!choice.text.trim()) return 'Choice text is required';
      return null;
    });
    if (choiceErrors.some(Boolean)) newErrors.choices = choiceErrors;

    // Check if at least one choice has a positive grade
    const hasPositiveGrade = formData.choices.some(choice => {
      const grade = choice.grade;
      return grade !== 'None' && parseFloat(grade) > 0;
    });
    if (!hasPositiveGrade) {
      newErrors.grade = 'At least one choice must have a positive grade';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const saveQuestion = useCallback(async () => {
    if (!validate()) {
      console.warn('⚠️ Validation failed');
      return false;
    }

    try {
      setSaving(true);
      console.log(' Saving Multiple Choice question:', formData);
      
      const result = await questionAPI.createMultipleChoiceQuestion(formData);
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
  }, [formData, validate]);

  const resetForm = useCallback((question = {}) => {
    setFormData({
      ...DEFAULT_MULTIPLE_CHOICE_QUESTION,
      ...question,
      choices: createFreshChoices(question.choices)
    });
    setErrors({});
  }, []);

  useEffect(() => {
    if (initialQuestion && Object.keys(initialQuestion).length > 0) {
      resetForm(initialQuestion);
    }
  }, [initialQuestion, resetForm]);

  return {
    formData,
    errors,
    availableTags,
    tagsLoading,
    tagsError,
    saving,
    updateField,
    updateChoice,
    addChoice,
    removeChoice,
    handleTagToggle,
    validate,
    saveQuestion,
    resetForm
  };
};