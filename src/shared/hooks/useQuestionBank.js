// hooks/useQuestionBank.js
import { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';

export const useQuestionBank = (initialQuestions = []) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [username, setUsername] = useState(localStorage.getItem('usernameoremail') || "Unknown User");

  useEffect(() => {
    const handleStorage = () => {
      setUsername(localStorage.getItem('usernameoremail') || "Unknown User");
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const mapQuestionType = (xmlType) => {
    switch (xmlType) {
      case "multichoice": return "multichoice";
      case "essay": return "essay";
      case "matching": return "matching";
      case "shortanswer": return "shortanswer";
      case "truefalse": return "truefalse";
      case "ddimageortext": return "ddimageortext";
      case "ddmarker": return "ddmarker";
      case "ddwtos": return "ddwtos";
      case "numerical": return "numerical";
      case "calculated": return "calculated";
      case "calculatedmulti": return "calculatedmulti";
      case "calculatedsimple": return "calculatedsimple";
      case "multianswer": return "multianswer";
      case "randomsamatch": return "randomsamatch";
      case "gapselect": return "gapselect";
      default: return "multichoice";
    }
  };

  // Add a new question immutably
  const addQuestion = (newQuestion) => {
    setQuestions(prev => [...prev, newQuestion]);
  };

  // Edit a question immutably
  const editQuestion = (updatedQuestion) => {
    setQuestions(prev =>
      prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
    );
  };

  // Bulk edit questions immutably
  const bulkEditQuestions = (editedQuestions) => {
    setQuestions(prev =>
      prev.map(q =>
        editedQuestions.find(eq => eq.id === q.id) || q
      )
    );
  };

  //  FIXED: Proper handleFileUpload with duplicate detection
  const handleFileUpload = async (file, newQuestions) => {
    console.log(' Starting import process:', {
      file: file.name,
      newQuestionsCount: newQuestions.length,
      currentQuestionsCount: questions.length
    });

    try {
      // Detect duplicates by comparing titles and question text
      const duplicates = [];
      const uniqueQuestions = [];

      newQuestions.forEach(newQ => {
        const isDuplicate = questions.some(existingQ => {
          const titleMatch = existingQ.title.toLowerCase().trim() === newQ.title.toLowerCase().trim();
          const textMatch = existingQ.questionText.toLowerCase().trim() === newQ.questionText.toLowerCase().trim();
          const idMatch = existingQ.id === newQ.id;
          
          return titleMatch || textMatch || idMatch;
        });

        if (isDuplicate) {
          duplicates.push(newQ);
          console.log(' Duplicate detected:', newQ.title);
        } else {
          // Ensure unique IDs for new questions
          const maxId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) : 0;
          const questionWithNewId = {
            ...newQ,
            id: typeof newQ.id === 'string' ? maxId + uniqueQuestions.length + 1 : newQ.id,
            status: newQ.status || 'draft',
            version: newQ.version || 'v1',
            createdBy: newQ.createdBy || {
              name: 'Imported',
              role: '',
              date: new Date().toLocaleDateString()
            },
            modifiedBy: newQ.modifiedBy || {
              name: 'Imported',
              role: '',
              date: new Date().toLocaleDateString()
            },
            comments: newQ.comments || 0,
            usage: newQ.usage || 0,
            lastUsed: newQ.lastUsed || '',
            history: newQ.history || [{
              version: "v1",
              date: new Date().toLocaleDateString(),
              author: "Imported",
              changes: `Imported from ${file.name}`
            }]
          };
          
          uniqueQuestions.push(questionWithNewId);
          console.log(' New question added:', questionWithNewId.title);
        }
      });

      console.log(' Import summary:', {
        totalProcessed: newQuestions.length,
        uniqueAdded: uniqueQuestions.length,
        duplicatesSkipped: duplicates.length,
        newTotalWillBe: questions.length + uniqueQuestions.length
      });

      // Update state with new questions
      setQuestions(prev => {
        const updated = [...uniqueQuestions, ...prev];
        console.log(' State updated:', {
          previousCount: prev.length,
          newCount: updated.length,
          questionsAdded: uniqueQuestions.length
        });
        return updated;
      });

      return {
        imported: uniqueQuestions.length,
        duplicates: duplicates.length,
        total: questions.length + uniqueQuestions.length
      };

    } catch (error) {
      // console.error(' Import error:', error);
      throw error;
    }
  };

  const duplicateQuestion = (question) => {
    const newQuestion = {
      ...question,
      id: Math.max(...questions.map(q => q.id)) + 1,
      title: `Copy of: ${question.title}`,
      version: 'v1',
      status: 'draft',
      
      //  CRITICAL FIX: Always use qtype field consistently
      qtype: question.qtype || 'multichoice', // Use qtype as primary
      
      createdBy: {
        name: username,
        role: "",
        date: new Date().toLocaleString()
      },
      modifiedBy: {
        name: username,
        role: "",
        date: new Date().toLocaleString()
      },
      history: [{
        version: "v1",
        date: new Date().toLocaleDateString(),
        author: username,
        changes: "Duplicated from original question"
      }],
      comments: 0,
      usage: 0,
      lastUsed: "Never"
    };
    
    //  IMPORTANT: Remove questionType field to avoid conflicts
    delete newQuestion.questionType;

    setQuestions(prev => [...prev, newQuestion]);
  };

  const deleteQuestion = (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  const changeStatus = (questionId, newStatus) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              status: newStatus,
              version: `v${parseInt(q.version.substring(1)) + 1}`,
              modifiedBy: {
                ...q.modifiedBy,
                date: new Date().toLocaleString()
              },
              history: [
                ...q.history,
                {
                  version: `v${parseInt(q.version.substring(1)) + 1}`,
                  date: new Date().toLocaleDateString(),
                  author: username,
                  changes: `Changed status to ${newStatus}`
                }
              ]
            }
          : q
      )
    );
  };

  return {
    questions,
    setQuestions,
    selectedQuestions,
    setSelectedQuestions,
    username,
    handleFileUpload,
    duplicateQuestion,
    deleteQuestion,
    changeStatus,
    addQuestion,
    editQuestion,
    bulkEditQuestions
  };
};