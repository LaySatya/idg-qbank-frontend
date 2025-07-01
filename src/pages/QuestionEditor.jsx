import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Trash } from 'lucide-react';

const QuestionEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialQuestion = location.state?.question || {
    id: Date.now(),
    questiontext: '',
    category: 'Computer Science',
    type: 'Multiple Choice',
    difficulty: 'Medium',
    status: 'draft',
    tags: [],
    options: ['', ''],
    correctAnswer: '',
    versions: [{
      id: 1,
      date: new Date().toISOString().split('T')[0],
      author: 'Current User',
      changes: 'Initial creation'
    }],
    comments: [],
    usage: {
      quizCount: 0,
      lastUsed: null,
      facilityIndex: null,
      discriminativeEfficiency: null
    }
  };

  const [question, setQuestion] = useState(initialQuestion);
  const [previewMode, setPreviewMode] = useState(false);

  // Handle question text change
  const handleQuestionTextChange = (e) => {
    setQuestion({
      ...question,
      questiontext: e.target.value
    });
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    
    setQuestion({
      ...question,
      options: newOptions
    });
  };

  // Add new option
  const addOption = () => {
    setQuestion({
      ...question,
      options: [...question.options, '']
    });
  };

  // Remove option
  const removeOption = (index) => {
    const newOptions = [...question.options];
    newOptions.splice(index, 1);
    
    const newCorrectAnswer = question.correctAnswer === question.options[index] 
      ? '' 
      : question.correctAnswer;
    
    setQuestion({
      ...question,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    });
  };

  // Set correct answer
  const setCorrectAnswer = (option) => {
    setQuestion({
      ...question,
      correctAnswer: option
    });
  };

  // Handle save
  const handleSave = () => {
    // Here you would typically send the question to your API
    console.log('Saving question:', question);
    
    // Add a new version entry
    const updatedQuestion = {
      ...question,
      versions: [
        ...question.versions,
        {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          author: 'Current User',
          changes: 'Updated question'
        }
      ]
    };
    
    // Navigate back to question bank with a success message
    navigate('/question-bank', { 
      state: { 
        message: 'Question saved successfully!',
        updatedQuestion 
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/question-bank')}
            className="text-gray-600 hover:text-gray-800 mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {location.state?.question ? 'Edit Question' : 'Create New Question'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              previewMode 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye size={18} />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
          >
            <Save size={18} />
            Save
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6">
        {previewMode ? (
          // Preview Mode
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium mb-2">Question</h2>
              <div className="prose" dangerouslySetInnerHTML={{ __html: question.questiontext }}></div>
            </div>
            
            {question.type === 'Multiple Choice' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Options</h2>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center p-2 rounded border">
                      <input
                        type="radio"
                        checked={option === question.correctAnswer}
                        readOnly
                        className="mr-2"
                      />
                      <span className={option === question.correctAnswer ? 'font-medium' : ''}>
                        {option || '(Empty option)'}
                      </span>
                      {option === question.correctAnswer && (
                        <span className="ml-2 text-green-600 text-sm">(Correct)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Question Details</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Category:</div>
                  <div>{question.category}</div>
                  <div className="font-medium">Type:</div>
                  <div>{question.type}</div>
                  <div className="font-medium">Difficulty:</div>
                  <div>{question.difficulty}</div>
                  <div className="font-medium">Status:</div>
                  <div className={`px-2 py-1 rounded text-xs inline-block ${
                    question.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {question.status}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {question.tags.length > 0 ? (
                    question.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={question.questiontext}
                onChange={handleQuestionTextChange}
                placeholder="Enter your question here..."
              ></textarea>
            </div>
            
            {/* Options (for Multiple Choice) */}
            {question.type === 'Multiple Choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="radio"
                      checked={option === question.correctAnswer}
                      onChange={() => setCorrectAnswer(option)}
                      className="mr-2"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="ml-2 text-red-600 p-1 hover:bg-red-50 rounded"
                      disabled={question.options.length <= 2}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            )}
            
            {/* Question Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={question.category}
                  onChange={(e) => setQuestion({...question, category: e.target.value})}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Networking">Networking</option>
                  <option value="Programming">Programming</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={question.type}
                  onChange={(e) => setQuestion({...question, type: e.target.value})}
                >
                  <option value="Multiple Choice">Multiple Choice</option>
                  <option value="True/False">True/False</option>
                  <option value="Short Answer">Short Answer</option>
                  <option value="Essay">Essay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={question.difficulty}
                  onChange={(e) => setQuestion({...question, difficulty: e.target.value})}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={question.status}
                  onChange={(e) => setQuestion({...question, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={question.tags.join(', ')}
                onChange={(e) => {
                  const tagsString = e.target.value;
                  const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setQuestion({...question, tags: tagsArray});
                }}
                placeholder="e.g., OOP, Programming, Data Structures"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;