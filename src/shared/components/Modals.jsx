// components/Modals.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { X, Edit, Clock, User, FileText, Save, Send, CheckSquare } from 'lucide-react';

// FIXED: Correct paths (go up 3 levels from pages/QuestionBank/components/)
// import CreateQuestionModal from "./CreateQuestionModal";  // This one stays the same
// import CreateTrueFalseQuestion from "../../features/questions/components/forms/CreateTrueFalseQuestion";
// import CreateMultipleChoiceQuestion from "../../features/questions/components/forms/CreateMultipleChoiceQuestion";
// import BulkEditQuestionsModal from "../../features/questions/components/forms/BulkEditModal";

// Save Confirmation Modal
const SaveConfirmationModal = ({ questionId, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md pointer-events-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Save Changes?</h3>
          <p className="mb-6 text-gray-600">
            Do you want to save your changes to this question?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(questionId)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// History Modal Component
const HistoryModal = ({ question, onClose }) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl pointer-events-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Version History: {question.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Version</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Author</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Changes</th>
              </tr>
            </thead>
                       <tbody>
              {(Array.isArray(question.history) && question.history.length > 0) ? (
                question.history.map((version, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{version.version}</td>
                    <td className="border border-gray-300 px-4 py-2">{version.date}</td>
                    <td className="border border-gray-300 px-4 py-2">{version.author}</td>
                    <td className="border border-gray-300 px-4 py-2">{version.changes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                    No history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Preview Modal Component with Quiz-style Preview
const PreviewModal = ({ question, onClose, onEdit }) => {
  if (!question) return null;

  //  FIXED: Check both qtype and questionType for multiple choice questions
  if (question.qtype === 'multichoice' || question.questionType === 'multiple') {
    return <QuizStylePreview question={question} onClose={onClose} onEdit={onEdit} />;
  }

  //  FIXED: Check both qtype and questionType for true/false questions
  if (question.qtype === 'truefalse' || question.questionType === 'truefalse') {
    return <TrueFalsePreview question={question} onClose={onClose} onEdit={onEdit} />;
  }

  // For other question types, show traditional preview
  return <TraditionalPreview question={question} onClose={onClose} onEdit={onEdit} />;
};

// True/False Preview Component
const TrueFalsePreview = ({ question, onClose, onEdit }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [currentScore, setCurrentScore] = useState(0);

  // Calculate score based on selected answer
  useEffect(() => {
    if (!selectedAnswer) {
      setCurrentScore(0);
      return;
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    setCurrentScore(isCorrect ? (question.defaultMark || 1) : 0);
  }, [selectedAnswer, question]);

  const handleAnswerChange = (answer) => {
    setSelectedAnswer(answer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-4xl h-[90vh] flex flex-col">
        {/* Header - Quiz Style */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                Question Preview
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  Preview Mode
                </span>
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>Preview check</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText size={16} />
                  <span>Question Type: True/False</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Question Content - Quiz Style */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                      1
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{question.title}</h3>
                      {/* Teacher Edit Link */}
                      <button
                        onClick={() => onEdit && onEdit(question)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit question"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Mark: {currentScore}/{question.defaultMark || 1}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {question.defaultMark || 1} point{question.defaultMark !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    True/False
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-gray-900 leading-relaxed">{question.questionText || 'No question text'}</p>
              </div>

              {/* True/False Options */}
              <div className="space-y-3">
                <label
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnswer === 'true'
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="truefalse_answer"
                    value="true"
                    checked={selectedAnswer === 'true'}
                    onChange={() => handleAnswerChange('true')}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">a.</span>
                      <span className="text-gray-900">True</span>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAnswer === 'false'
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="truefalse_answer"
                    value="false"
                    checked={selectedAnswer === 'false'}
                    onChange={() => handleAnswerChange('false')}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">b.</span>
                      <span className="text-gray-900">False</span>
                    </div>
                  </div>
                </label>
              </div>

              {/* General Feedback */}
              {question.generalFeedback && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>General Feedback:</strong> {question.generalFeedback}
                  </p>
                </div>
              )}

              {/* Show specific feedback if answer is selected */}
              {selectedAnswer && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Feedback:</strong> {selectedAnswer === 'true' ? question.feedbackTrue : question.feedbackFalse}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Quiz Style */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Current score: <span className="font-medium">{currentScore}/{question.defaultMark || 1}</span>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  alert(`Preview saved!\nSelected answer: ${selectedAnswer ? (selectedAnswer === 'true' ? 'True' : 'False') : 'None'}\nScore: ${currentScore}/${question.defaultMark || 1}`);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Save size={16} className="mr-2" />
                Save without submitting
              </button>
              <button 
                onClick={() => {
                  const isCorrect = selectedAnswer === question.correctAnswer;
                  alert(`Answer submitted!\n\nYour answer: ${selectedAnswer ? (selectedAnswer === 'true' ? 'True' : 'False') : 'None'}\nCorrect answer: ${question.correctAnswer === 'true' ? 'True' : 'False'}\n\nScore: ${currentScore}/${question.defaultMark || 1}\nResult: ${isCorrect ? 'Correct!' : 'Incorrect'}\n\nThis is a preview - no scores are saved.`);
                  setTimeout(() => onClose(), 1500);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <CheckSquare size={16} className="mr-2" />
                Submit answer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quiz-style Preview Component for Multiple Choice (mimics the teacher quiz preview)
const QuizStylePreview = ({ question, onClose, onEdit }) => {
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);

  // Determine if this is single or multiple answer based on question data
  const isMultipleAnswer = !!question.multipleAnswers;
  console.log('isMultipleAnswer:', isMultipleAnswer, question);

  // Calculate score based on selected answers
  useEffect(() => {
    if (!question.choices && !question.options) return;
    let score = 0;
    if (question.choices) {
      // New format with choices array
      const correctChoices = question.choices.filter(choice => choice.isCorrect);
      const selectedSet = new Set(selectedAnswers);
      const correctSet = new Set(correctChoices.map(c => c.id));
      
      if (isMultipleAnswer) {
        // For multiple answers: exact match required
        if (selectedSet.size === correctSet.size && 
            [...selectedSet].every(id => correctSet.has(id))) {
          score = question.defaultMark || 1;
        }
      } else {
        // For single answer: check if correct choice is selected
        const correctChoice = correctChoices[0];
        if (correctChoice && selectedAnswers.includes(correctChoice.id)) {
          score = question.defaultMark || 1;
        }
      }
    } else if (question.options && question.correctAnswers) {
      // Legacy format with options array
      const selectedTexts = selectedAnswers.map(idx => question.options[idx]).filter(Boolean);
      const correctSet = new Set(question.correctAnswers);
      const selectedSet = new Set(selectedTexts);
      
      if (isMultipleAnswer) {
        // For multiple answers: exact match required
        if (selectedSet.size === correctSet.size && 
            [...selectedSet].every(text => correctSet.has(text))) {
          score = question.defaultMark || 1;
        }
      } else {
        // For single answer: check if correct option is selected
        if (selectedTexts.length === 1 && correctSet.has(selectedTexts[0])) {
          score = question.defaultMark || 1;
        }
      }
    }
    
    setCurrentScore(score);
  }, [selectedAnswers, question, isMultipleAnswer]);

  const handleAnswerChange = (choiceId) => {
    if (isMultipleAnswer) {
      setSelectedAnswers(prev => 
        prev.includes(choiceId)
          ? prev.filter(id => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      setSelectedAnswers([choiceId]);
    }
  };

  // Prepare choices for display
  const displayChoices = question.choices || 
    (question.options ? question.options.map((opt, idx) => ({ id: idx, text: opt, isCorrect: question.correctAnswers?.includes(opt) })) : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-4xl h-[90vh] flex flex-col">
        {/* Header - Quiz Style */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                Question Preview
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  Preview Mode
                </span>
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>Preview check</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText size={16} />
                  <span>Question Type: Multiple Choice</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Question Content - Quiz Style */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                      1
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{question.title}</h3>
                      {/* Teacher Edit Link */}
                      <button
                        onClick={() => onEdit && onEdit(question)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit question"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Mark: {currentScore}/{question.defaultMark || 1}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {question.defaultMark || 1} point{question.defaultMark !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isMultipleAnswer ? 'Multiple answers' : 'Single answer'}
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-gray-900 leading-relaxed">{question.questionText || 'No question text'}</p>
              </div>

              {/* Answer Choices */}
              {displayChoices.length > 0 && (
                <div className="space-y-3">
                  {displayChoices.map((choice, choiceIndex) => {
                    const isSelected = selectedAnswers.includes(choice.id);
                    const inputType = isMultipleAnswer ? 'checkbox' : 'radio';
                    const inputId = `preview_choice_${choice.id}`;

                    return (
                      <label
                        key={choice.id}
                        htmlFor={inputId}
                        className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type={inputType}
                          id={inputId}
                          name={isMultipleAnswer ? undefined : 'preview_question'}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(choice.id)}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              {String.fromCharCode(97 + choiceIndex)}.
                            </span>
                            <span className="text-gray-900">{choice.text}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Question Instructions */}
              {isMultipleAnswer && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Select all correct answers. You must choose all correct options and no incorrect ones to receive full marks.
                  </p>
                </div>
              )}

              {/* General Feedback */}
              {question.generalFeedback && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>General Feedback:</strong> {question.generalFeedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Quiz Style */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Current score: <span className="font-medium">{currentScore}/{question.defaultMark || 1}</span>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  const selectedTexts = selectedAnswers.map(id => {
                    const choice = displayChoices.find(c => c.id === id);
                    return choice ? choice.text : id;
                  });
                  alert(`Preview saved!\nSelected answers: ${selectedTexts.length > 0 ? selectedTexts.join(', ') : 'None'}\nScore: ${currentScore}/${question.defaultMark || 1}`);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Save size={16} className="mr-2" />
                Save without submitting
              </button>
              <button 
                onClick={() => {
                  const selectedTexts = selectedAnswers.map(id => {
                    const choice = displayChoices.find(c => c.id === id);
                    return choice ? choice.text : id;
                  });
                  
                  const correctChoices = displayChoices.filter(choice => choice.isCorrect);
                  const isCorrect = isMultipleAnswer 
                    ? selectedAnswers.length === correctChoices.length && 
                      selectedAnswers.every(id => correctChoices.some(c => c.id === id)) &&
                      correctChoices.every(c => selectedAnswers.includes(c.id))
                    : selectedAnswers.length === 1 && correctChoices.some(c => selectedAnswers.includes(c.id));
                  
                  alert(`Answer submitted!\n\nYour answers: ${selectedTexts.length > 0 ? selectedTexts.join(', ') : 'None'}\n\nScore: ${currentScore}/${question.defaultMark || 1}\nResult: ${isCorrect ? 'Correct!' : 'Incorrect'}\n\nThis is a preview - no scores are saved.`);
                  
                  setTimeout(() => onClose(), 1500);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <CheckSquare size={16} className="mr-2" />
                Submit answer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Traditional Preview Component (for non-multiple choice questions)
const TraditionalPreview = ({ question, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Question Preview: {question.title}</h2>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(question)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit question"
              >
                <Edit size={16} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="border rounded-md p-4 mb-6 bg-gray-50">
            <div className="mb-4">
              <h3 className="font-bold mb-2">Question Text</h3>
              <p>{question.questionText || "No question text"}</p>
            </div>
            
            {(question.qtype === 'truefalse' || question.questionType === 'truefalse') && (
              <div>
                <h3 className="font-bold mb-2">Correct Answer:</h3>
                <div>{question.correctAnswer === 'true' ? 'True' : 'False'}</div>
                <div className="mt-2">
                  <strong>Feedback (True):</strong> {question.feedbackTrue}
                </div>
                <div>
                  <strong>Feedback (False):</strong> {question.feedbackFalse}
                </div>
              </div>
            )}
            
            {['essay', 'shortanswer'].includes(question.qtype || question.questionType) && (
              <div>
                <h3 className="font-bold mb-2">Answer:</h3>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="5"
                  placeholder="Student would enter response here"
                  readOnly
                ></textarea>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">Question Details</h3>
              <div className="space-y-1">
                {/*  FIXED: Show both qtype and questionType */}
                <p><strong>Type:</strong> {question.qtype || question.questionType}</p>
                <p><strong>Status:</strong> {question.status}</p>
                <p><strong>Created by:</strong> {question.createdBy?.name}</p>
                <p><strong>Version:</strong> {question.version}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">Usage Information</h3>
              <div className="space-y-1">
                <p><strong>Used in:</strong> {question.usage} quizzes</p>
                <p><strong>Last used:</strong> {question.lastUsed}</p>
                <p><strong>Comments:</strong> {question.comments}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Modals = ({
  // Create modals
  showCreateModal,
  setShowCreateModal,
  showTrueFalseModal,
  setShowTrueFalseModal,
  showMultipleChoiceModal,
  setShowMultipleChoiceModal,
  
  // Edit modals
  showBulkEditModal,
  setShowBulkEditModal,
  editingQuestionData,
  setEditingQuestionData,
  
  // Preview/History modals
  previewQuestion,
  setPreviewQuestion,
  historyModal,
  setHistoryModal,
  
  // Save confirmation
  showSaveConfirm,
  setShowSaveConfirm,
  editingQuestion,
  setEditingQuestion,
  newQuestionTitle, // Add this missing prop
  
  // Data
  questions,
  setQuestions,
  selectedQuestions,
  setSelectedQuestions,
  username,
  
  // Components
  EDIT_COMPONENTS,
  BULK_EDIT_COMPONENTS
}) => {
  // console.log("Editing question data:", editingQuestionData);
  
  const confirmSave = (questionId, newQuestionTitle) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? {
              ...q, 
              title: newQuestionTitle,
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
                  changes: "Updated question title"
                }
              ]
            }
          : q
      )
    );
    setShowSaveConfirm(false);
    setEditingQuestion(null);
  };

  const cancelSave = () => {
    setShowSaveConfirm(false);
    setEditingQuestion(null);
  };

  // FIXED: Enhanced handleQuestionSave function
  const handleQuestionSave = (questionData, isNew = true) => {
    // console.log(' Handling question save in Modal:', questionData, 'isNew:', isNew);
    
    if (isNew) {
      const safeQuestion = {
        ...questionData,
        title: questionData.title || 'Untitled',
        questionText: questionData.questionText || '',
        defaultMark: questionData.defaultMark ?? 1,
        generalFeedback: questionData.generalFeedback || '',
        status: questionData.status || questionData.questionStatus || 'draft',
        
        //  ENSURE qtype is always set
        qtype: questionData.qtype || 'multichoice'
      };
      
      //  REMOVE any questionType field
      delete safeQuestion.questionType;
      
      setQuestions(prev => [
        {
          id: prev.length > 0 ? Math.max(...prev.map(q => q.id)) + 1 : 1,
          version: "v1",
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
          comments: 0,
          usage: 0,
          lastUsed: "Never",
          history: [
            {
              version: "v1",
              date: new Date().toLocaleDateString(),
              author: username,
              changes: `Created ${questionData.qtype} question` //  CHANGED: Use qtype
            }
          ],
          ...safeQuestion
        },
        ...prev
      ]);
      
      // console.log(' New question added successfully');
    } else {
      // Update existing question
      setQuestions(prev =>
        prev.map(q =>
          q.id === editingQuestionData.id
            ? {
                ...q,
                ...questionData,
                //  ENSURE qtype consistency
                qtype: questionData.qtype || q.qtype || 'multichoice',
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
                    changes: "Edited question"
                  }
                ]
              }
            : q
        )
      );
      
      console.log(' Question updated successfully');
    }
  };

  return (
    <>
      {/* Create Question Modal */}
      {showCreateModal && (
        <CreateQuestionModal
          onClose={() => setShowCreateModal(false)}
          onSelectType={(type) => {
            setShowCreateModal(false);
            if (type.name === 'True/False') setShowTrueFalseModal(true);
            if (type.name === 'Multiple choice') setShowMultipleChoiceModal(true);
          }}
          questions={questions}
        />
      )}

      {/*  FIXED: True/False Question Modal */}
      {/* {showTrueFalseModal && (
        <CreateTrueFalseQuestion
          onClose={() => setShowTrueFalseModal(false)}
          onSave={(questionData) => {
            // console.log(' Saving True/False Question from Modal:', questionData);
            setShowTrueFalseModal(false);
            
            const processedData = {
              ...questionData,
              qtype: "truefalse", //  CHANGED: Use qtype instead of questionType
              correctAnswer: questionData.correctAnswer || 'true',
              penalty: questionData.penalty ?? 0,
              feedbackTrue: questionData.feedbackTrue || '',
              feedbackFalse: questionData.feedbackFalse || '',
              
              // Ensure all required fields are present
              title: questionData.title || 'Untitled Question',
              questionText: questionData.questionText || '',
              defaultMark: questionData.defaultMark || 1,
              status: questionData.questionStatus || 'draft',
              tags: questionData.tags || []
            };
            
            // IMPORTANT: Remove questionType to avoid conflicts
            delete processedData.questionType;
            
            // console.log(' Processed true/false data:', processedData);
            handleQuestionSave(processedData);
          }}
        />
      )} */}

      {/*  FIXED: Multiple Choice Question Modal */}
      {/* {showMultipleChoiceModal && (
        <CreateMultipleChoiceQuestion
          onClose={() => setShowMultipleChoiceModal(false)}
          onSave={(questionData) => {
            // console.log(' Saving Multiple Choice Question from Modal:', questionData);
            setShowMultipleChoiceModal(false);
            
            const choices = Array.isArray(questionData.choices) ? questionData.choices : [];
            
            //  CRITICAL FIX: Ensure isCorrect and both text/answer fields are set for each choice
            const processedChoices = choices.map((choice, index) => ({
              ...choice,
              id: choice.id || index,
              text: choice.text || '', // Ensure text field exists
              answer: choice.text || '', // Ensure answer field exists for compatibility
              isCorrect: !!choice.isCorrect, // force boolean
              grade: choice.grade || 'None',
              feedback: choice.feedback || ''
            }));
            
            const options = processedChoices.map(a => a.text);
            const correctAnswers = processedChoices
              .filter(a => a.isCorrect)
              .map(a => a.text);
          
            const processedData = {
              ...questionData,
              qtype: "multichoice", //  CHANGED: Use qtype instead of questionType
              options,
              correctAnswers,
              choices: processedChoices, // Keep the full choices array for preview
              multipleAnswers: correctAnswers.length > 1,
              
              // Ensure all required fields are present
              title: questionData.title || 'Untitled Question',
              questionText: questionData.questionText || '',
              defaultMark: questionData.defaultMark || 1,
              status: questionData.questionStatus || 'draft',
              tags: questionData.tags || []
            };
            
            //  IMPORTANT: Remove questionType to avoid conflicts
            delete processedData.questionType;
            
            // console.log(' Processed multiple choice data:', processedData);
            handleQuestionSave(processedData);
          }}
        />
      )} */}

      {/* FIXED: Bulk Edit Modal */}
      {showBulkEditModal && (() => {
        const questionsToEdit = questions.filter(q => selectedQuestions.includes(q.id));
        //  FIXED: Check both qtype and questionType
        const types = [...new Set(questionsToEdit.map(q => q.qtype || q.questionType))];

        if (types.length === 1 && BULK_EDIT_COMPONENTS[types[0]]) {
          const BulkEditComponent = BULK_EDIT_COMPONENTS[types[0]];
          return (
            <BulkEditComponent
              questions={[...questionsToEdit]}
              onClose={() => setShowBulkEditModal(false)}
              onSave={updatedQuestions => {
                setQuestions(prev =>
                  prev.map(q => {
                    const edited = updatedQuestions.find(uq => uq.id === q.id);
                    return edited
                      ? {
                          ...q,
                          ...edited,
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
                              changes: "Bulk edited"
                            }
                          ]
                        }
                      : q;
                  })
                );
                setShowBulkEditModal(false);
                setSelectedQuestions([]);
              }}
              isBulk
            />
          );
        } else if (questionsToEdit.length > 0) {
          return (
            <BulkEditQuestionsModal
              questions={[...questionsToEdit]}
              onClose={() => setShowBulkEditModal(false)}
              onSave={updatedQuestions => {
                setQuestions(prev =>
                  prev.map(q => {
                    const edited = updatedQuestions.find(uq => uq.id === q.id);
                    return edited
                      ? {
                          ...q,
                          ...edited,
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
                              changes: "Bulk edited"
                            }
                          ]
                        }
                      : q;
                  })
                );
                setShowBulkEditModal(false);
                setSelectedQuestions([]);
              }}
            />
          );
        }
        return null;
      })()}

      {/*  FIXED: Individual Edit Modal */}
      {editingQuestionData && EDIT_COMPONENTS[editingQuestionData.qtype || editingQuestionData.questionType] && (
        React.createElement(EDIT_COMPONENTS[editingQuestionData.qtype || editingQuestionData.questionType], {
          ...(editingQuestionData.qtype === "truefalse" || editingQuestionData.questionType === "truefalse"
            ? { existingQuestion: editingQuestionData }
            : { question: editingQuestionData }),
          onClose: () => setEditingQuestionData(null),
          onSave: updatedData => {
            handleQuestionSave(updatedData, false);
            setEditingQuestionData(null);
          }
        })
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <SaveConfirmationModal
          questionId={editingQuestion}
          onConfirm={(questionId) => confirmSave(questionId, newQuestionTitle)}
          onCancel={cancelSave}
        />
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <PreviewModal 
          question={previewQuestion} 
          onClose={() => setPreviewQuestion(null)}
          onEdit={setEditingQuestionData}
        />
      )}

      {/* History Modal */}
      {/* {historyModal && (
        <HistoryModal 
          question={historyModal} 
          onClose={() => setHistoryModal(null)} 
        />
      )} */}
    </>
  );
};

export default Modals;