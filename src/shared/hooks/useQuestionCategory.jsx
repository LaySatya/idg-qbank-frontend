import { useState, useEffect } from "react";
import getQuestionCategoryApi from "../../api/questionCategoryApi";

const useQuestionCategory = (courseId) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getQuestionCategoryApi().getAllCategories(courseId);
        setCategories(response.categories || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [courseId]);

  return { categories, loading, error };
};

export default useQuestionCategory;