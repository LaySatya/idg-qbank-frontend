export const parseXMLToQuestions = (xmlContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  const questions = [];
  const questionElements = xmlDoc.querySelectorAll('question[type!="category"]');
  
  questionElements.forEach((questionEl, index) => {
    const name = questionEl.querySelector('name text')?.textContent || '';
    const questionText = questionEl.querySelector('questiontext text')?.textContent || '';
    const type = questionEl.getAttribute('type');
    const single = questionEl.querySelector('single')?.textContent === 'true';
    
    let options = [];
    let correctAnswers = [];
    let questionType = 'Other';
    
    if (type === 'multichoice') {
      const answers = questionEl.querySelectorAll('answer');
      answers.forEach(answer => {
        const answerText = answer.querySelector('text')?.textContent || '';
        const fraction = parseFloat(answer.getAttribute('fraction') || '0');
        
        options.push(answerText);
        if (fraction > 0) {
          correctAnswers.push(answerText);
        }
      });
      
      // Determine question type based on XML structure
      if (single && correctAnswers.length === 1) {
        questionType = 'Multiple Choice';
      } else if (!single && correctAnswers.length > 1) {
        // Check if it's "Choose two" or "Choose three" etc.
        if (questionText.toLowerCase().includes('choose two')) {
          questionType = 'Multiple Select (Choose Two)';
        } else if (questionText.toLowerCase().includes('choose three')) {
          questionType = 'Multiple Select (Choose Three)';
        } else {
          questionType = 'Multiple Select';
        }
      } else {
        questionType = 'Multiple Choice';
      }
    } else if (type === 'truefalse') {
      questionType = 'True/False';
    } else if (type === 'shortanswer') {
      questionType = 'Short Answer';
    } else if (type === 'essay') {
      questionType = 'Essay';
    }
    
    const question = {
      id: `imported_${Date.now()}_${index}`,
      questiontext: questionText,
      name: name,
      type: questionType,
      category: 'Imported',
      difficulty: 'Medium',
      status: 'draft',
      tags: ['Imported', 'XML'],
      updated: new Date().toISOString().split('T')[0],
      options: options.length > 0 ? options : undefined,
      correctAnswer: correctAnswers.length === 1 ? correctAnswers[0] : 
                     correctAnswers.length > 1 ? correctAnswers.join(', ') : 
                     undefined,
      correctAnswers: correctAnswers, // Store all correct answers separately
      multiSelect: !single, // Flag to indicate if it's a multi-select question
      versions: [{
        id: 1,
        date: new Date().toISOString().split('T')[0],
        author: 'XML Import',
        changes: 'Imported from XML file'
      }],
      comments: [],
      usage: {
        quizCount: 0,
        lastUsed: null,
        facilityIndex: null,
        discriminativeEfficiency: null
      },
      needsChecking: true
    };
    
    questions.push(question);
  });
  
  return questions;
};