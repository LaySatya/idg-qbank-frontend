
export const normalizeQuestionFromExistingAPI = (apiQuestion) => {
  return {
    id: apiQuestion.id,
    title: apiQuestion.name,
    questionText: apiQuestion.questiontext,
    qtype: apiQuestion.qtype,
    questionType: apiQuestion.qtype,
    status: apiQuestion.status || 'ready',
    version: `v${apiQuestion.version || 1}`,
    comments: 0,
    usage: 0,
    lastUsed: '-',
    createdBy: {
      name: apiQuestion.createdbyuser ? 
        `${apiQuestion.createdbyuser.firstname} ${apiQuestion.createdbyuser.lastname}` : 
        'Unknown',
      role: '',
      date: apiQuestion.timecreated ? 
        new Date(apiQuestion.timecreated * 1000).toLocaleDateString() : 
        ''
    },
    modifiedBy: {
      name: apiQuestion.modifiedbyuser ? 
        `${apiQuestion.modifiedbyuser.firstname} ${apiQuestion.modifiedbyuser.lastname}` : 
        'Unknown',
      role: '',
      date: apiQuestion.timemodified ? 
        new Date(apiQuestion.timemodified * 1000).toLocaleDateString() : 
        ''
    },
    choices: apiQuestion.answers || [],
    tags: [], // Will be filled separately
    idNumber: apiQuestion.id
  };
};

export const fetchQuestionTags = async (questionId, token) => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/questions/question-tags?questionid=${questionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data.tags) ? data.tags : [];
    }
    return [];
  } catch (error) {
    console.warn(`Failed to fetch tags for question ${questionId}:`, error);
    return [];
  }
};

console.log(' Frontend fixes applied for existing backend API structure');