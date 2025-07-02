// ============================================================================
//  src/components/questions/hooks/useAPIData.js
// ============================================================================
import { useState, useEffect } from 'react';
import { questionAPI } from '../../../api/questionAPI';


export const useAPITags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const apiTags = await questionAPI.getTags();
        setTags(apiTags);
        setError(null);
      } catch (err) {
        console.error(' Failed to fetch tags:', err);
        setError(err.message);
        // Fallback tags
        setTags(['exam', 'quiz', 'general', 'l1', 'l2', 'l3', 'hardware', 'software']);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
};

export const useAPICategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const apiCategories = await questionAPI.getCategories();
        setCategories(apiCategories);
        setError(null);
      } catch (err) {
        console.error(' Failed to fetch categories:', err);
        setError(err.message);
        setCategories([{ value: 1, label: 'Default Category' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useAPIQuestionTypes = () => {
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestionTypes = async () => {
      try {
        setLoading(true);
        const apiTypes = await questionAPI.getQuestionTypes();
        setQuestionTypes(apiTypes);
        setError(null);
      } catch (err) {
        console.error(' Failed to fetch question types:', err);
        setError(err.message);
        setQuestionTypes([
          { value: 'multichoice', label: 'Multiple Choice' },
          { value: 'truefalse', label: 'True/False' },
          { value: 'essay', label: 'Essay' },
          { value: 'shortanswer', label: 'Short Answer' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionTypes();
  }, []);

  return { questionTypes, loading, error };
};