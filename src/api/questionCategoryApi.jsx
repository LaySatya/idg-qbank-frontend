import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 const getQuestionCategoryApi = () => {
  return {
    getAllCategories: async (courseid) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/question-categories`,{
            params: {
                courseid: courseid
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching question categories:', error);
        throw error;
      }
    },
}
};

export default getQuestionCategoryApi;