import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Edit, Eye, Copy, Clock, Trash, MessageCircle, X, CheckCircle, AlertTriangle, Filter, Download, Upload } from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';
const QuestionBank = () => {
  // State management
  const [showQuestionText, setShowQuestionText] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
   
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    type: 'All'
  });
const [currentPage, setCurrentPage] = useState(1);
const questionsPerPage = 10;
const startIdx = (currentPage - 1) * questionsPerPage;
const endIdx = startIdx + questionsPerPage;
  const dropdownRef = useRef(null);

const importQuestionFromXML = (xmlString) => {
  const parser = new XMLParser();
  const result = parser.parse(xmlString);

  // Extract question data (adjust as needed for your XML structure)
  const q = result.question;
  const answers = Array.isArray(q.answer) ? q.answer : [q.answer];

  const newQuestion = {
    id: Math.max(...questions.map(q => q.id)) + 1,
    title: q.name.text,
    status: "ready",
    version: "v1",
    createdBy: {
      name: "Imported",
      role: "",
      date: new Date().toLocaleString()
    },
    comments: 0,
    usage: 0,
    lastUsed: "Never",
    modifiedBy: {
      name: "Imported",
      role: "",
      date: new Date().toLocaleString()
    },
    questionType: q['@_type'] === 'multichoice' ? 'multiple' : q['@_type'],
    questionText: q.questiontext.text,
    options: answers.map(a => ({
      text: a.text,
      correct: a['@_fraction'] === "100"
    })),
    history: [
      { version: "v1", date: new Date().toLocaleDateString(), author: "Imported", changes: "Imported from XML" }
    ]
  };

  setQuestions(prev => [...prev, newQuestion]);
};
  // Mock data for questions
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: "Diversity support",
      status: "ready",
      version: "v4",
      createdBy: {
        name: "Ms Reddy",
        role: "(Admin)",
        date: "14 November 2022, 9:37 AM"
      },
      comments: 2,
      usage: 1,
      lastUsed: "Tuesday, 15 November 2022, 8:25 AM",
      modifiedBy: {
        name: "Ms Reddy",
        role: "(Admin)",
        date: "14 November 2022, 9:37 AM"
      },
      questionType: "multiple",
      history: [
        { version: "v1", date: "10 November 2022", author: "Ms Reddy", changes: "Initial creation" },
        { version: "v2", date: "12 November 2022", author: "Ms Reddy", changes: "Added options" },
        { version: "v3", date: "13 November 2022", author: "Ms Reddy", changes: "Fixed formatting" },
        { version: "v4", date: "14 November 2022", author: "Ms Reddy", changes: "Final review" }
      ]
    },
    {
      id: 2,
      title: "Match the outcomes",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:34 AM"
      },
      comments: 1,
      usage: 1,
      lastUsed: "Tuesday, 15 November 2022, 8:25 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:34 AM"
      },
      questionType: "matching",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    },
    {
      id: 3,
      title: "British",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:43 AM"
      },
      comments: 1,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:43 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    },
    {
      id: 4,
      title: "Church",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:54 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:54 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    },
    {
      id: 5,
      title: "Define diversity",
      status: "ready",
      version: "v2",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:30 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Tuesday, 15 November 2022, 8:25 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:30 AM"
      },
      questionType: "shortanswer",
      history: [
        { version: "v1", date: "7 November 2022", author: "Mr C Wilson", changes: "Initial creation" },
        { version: "v2", date: "8 November 2022", author: "Mr C Wilson", changes: "Updated question wording" }
      ]
    },
    {
      id: 6,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    }, {
      id: 7,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    },
     {
      id: 8,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    } ,{
      id: 9,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    },
     {
      id: 10,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    }, {
      id: 11,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    } ,{
      id: 12,
      title: "Japan",
      status: "ready",
      version: "v1",
      createdBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      comments: 0,
      usage: 1,
      lastUsed: "Monday, 14 November 2022, 9:41 AM",
      modifiedBy: {
        name: "Mr C Wilson",
        role: "",
        date: "8 November 2022, 11:45 AM"
      },
      questionType: "essay",
      history: [
        { version: "v1", date: "8 November 2022", author: "Mr C Wilson", changes: "Initial creation" }
      ]
    }
  ]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionDropdown(null);
        setOpenStatusDropdown(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle individual question selection
  const toggleQuestionSelection = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  // Handle select all questions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuestions(questions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  // Get question type icon
  const getQuestionTypeIcon = (type) => {
    switch(type) {
      case 'multiple': return "•";
      case 'matching': return "⨯";
      case 'essay': return "☰";
      case 'shortanswer': return "☰";
      default: return "•";
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) {
      // In real implementation, this would call an API
      setQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
      setSelectedQuestions([]);
    }
  };

  // Handle status change
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
                date: new Date().toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              },
              history: [
                ...q.history,
                {
                  version: `v${parseInt(q.version.substring(1)) + 1}`,
                  date: new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }),
                  author: "Current User",
                  changes: `Changed status to ${newStatus}`
                }
              ]
            }
          : q
      )
    );
    setOpenStatusDropdown(null);
  };

  // Duplicate a question
  const duplicateQuestion = (question) => {
    const newQuestion = {
      ...question,
      id: Math.max(...questions.map(q => q.id)) + 1,
      title: `Copy of: ${question.title}`,
      version: 'v1',
      status: 'draft',
      createdBy: {
        name: "Current User",
        role: "",
        date: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      },
      modifiedBy: {
        name: "Current User",
        role: "",
        date: new Date().toLocaleString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      },
      history: [
        {
          version: "v1",
          date: new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          author: "Current User",
          changes: "Duplicated from original question"
        }
      ],
      comments: 0,
      usage: 0,
      lastUsed: "Never"
    };
    
    setQuestions(prev => [...prev, newQuestion]);
    setOpenActionDropdown(null);
  };

  // Delete a question
  const deleteQuestion = (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setOpenActionDropdown(null);
    }
  };
 
 
const startEditingTitle = (question) => {
  setEditingQuestion(question.id);
  setNewQuestionTitle(question.title);
};
const initiateQuestionSave = (questionId) => {
  if (newQuestionTitle.trim() === '') return;
  setShowSaveConfirm(true);
  // Do NOT setEditingQuestion(null) here!
};

const confirmSave = (questionId) => {
  setQuestions(prev => 
    prev.map(q => 
      q.id === questionId 
        ? {
            ...q, 
            title: newQuestionTitle,
            version: `v${parseInt(q.version.substring(1)) + 1}`,
            modifiedBy: {
              ...q.modifiedBy,
              date: new Date().toLocaleString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            },
            history: [
              ...q.history,
              {
                version: `v${parseInt(q.version.substring(1)) + 1}`,
                date: new Date().toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }),
                author: "Current User",
                changes: "Updated question title"
              }
            ]
          }
        : q
    )
  );
  setShowSaveConfirm(false);
  setEditingQuestion(null); // Only close input after confirming
};

const cancelSave = () => {
  setShowSaveConfirm(false);
  setEditingQuestion(null); // Only close input after cancelling
};
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
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* No dark background overlay */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl pointer-events-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Version History: {question.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content area */}
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
              {question.history.map((version, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-2">{version.version}</td>
                  <td className="border border-gray-300 px-4 py-2">{version.date}</td>
                  <td className="border border-gray-300 px-4 py-2">{version.author}</td>
                  <td className="border border-gray-300 px-4 py-2">{version.changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer with close button */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Close></Close>
          </button>
        </div>
      </div>
    </div>
  );
};

  // Preview Modal Component
const PreviewModal = ({ question, onClose }) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Notice: no dark background overlay here */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl pointer-events-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Question Preview: {question.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content area */}
        <div className="p-6">
          <div className="border rounded-md p-4 mb-6 bg-gray-50">
            <div className="mb-4">
              <h3 className="font-bold mb-2">Question Text</h3>
              <p>This is where the question text would appear.</p>
            </div>
            
            {question.questionType === 'essay' && (
              <div>
                <h3 className="font-bold mb-2">Answer:</h3>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows="5"
                  placeholder="Student would enter essay response here"
                  readOnly
                ></textarea>
              </div>
            )}
            
            {question.questionType === 'multiple' && (
              <div>
                <h3 className="font-bold mb-2">Options:</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <input type="radio" className="mt-1 mr-2" name="option" />
                    <div>Option 1</div>
                  </div>
                  <div className="flex items-start">
                    <input type="radio" className="mt-1 mr-2" name="option" />
                    <div>Option 2</div>
                  </div>
                  <div className="flex items-start">
                    <input type="radio" className="mt-1 mr-2" name="option" />
                    <div>Option 3</div>
                  </div>
                  <div className="flex items-start">
                    <input type="radio" className="mt-1 mr-2" name="option" checked />
                    <div>Option 4 (Correct)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">Question Details</h3>
              <div className="space-y-1">
                <p><strong>Type:</strong> {question.questionType}</p>
                <p><strong>Status:</strong> {question.status}</p>
                <p><strong>Created by:</strong> {question.createdBy.name}</p>
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
        
        {/* Footer with close button */}
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
 const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
  (filters.type === 'All' || q.questionType === filters.type) &&
  (filters.status === 'All' || q.status === filters.status)
  );
  const paginatedQuestions = filteredQuestions.slice(startIdx, endIdx);
  return (
    <div className="max-w-full">
      {/* Top Buttons Row */}
      <div className="p-4 flex flex-wrap gap-2 items-center">
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded">
          Create a new question ...
        </button>
        
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 rounded flex items-center">
          Add columns <ChevronDown size={14} className="ml-1" />
        </button>
        
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 rounded">
          Reset columns
        </button>
        
        <div className="flex items-center ml-4">
          <span className="mr-2">Show question text in the question list?</span>
          <select
          className="border rounded py-1 px-2"
          value={showQuestionText ? "Yes" : "No"}
          onChange={e => setShowQuestionText(e.target.value === "Yes")}
        >
          <option value="Yes">Yes, text only</option>
          <option value="No">No</option>
        </select>
        </div>
      </div>
      
      {/* Search and Filters Row */}
      {selectedQuestions.length > 0 && (
        <div className="p-4 bg-blue-50 flex flex-wrap gap-2 items-center">
          <span>{selectedQuestions.length} questions selected</span>
          
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded flex items-center text-sm"
            onClick={() => alert('Bulk edit would open a modal')}
          >
            <Edit size={14} className="mr-1" /> Edit
          </button>
          
          <button 
            className="bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded flex items-center text-sm"
            onClick={handleBulkDelete}
          >
            <Trash size={14} className="mr-1" /> Delete
          </button>
          
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded flex items-center text-sm"
            onClick={() => alert('Bulk duplicate would be handled here')}
          >
            <Copy size={14} className="mr-1" /> Duplicate
          </button>
          
          <button 
            className="bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded flex items-center text-sm"
            onClick={() => alert('Export to XML would happen here')}
          >
            <Download size={14} className="mr-1" /> Export XML
          </button>
          
          <button 
            className="ml-auto text-blue-600 hover:underline text-sm"
            onClick={() => setSelectedQuestions([])}
          >
            Clear selection
          </button>
        </div>
      )}
      
      {/* Search and Filter Options */}
      <div className="p-4 border-t border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-center">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <select 
          className="border rounded py-2 px-3"
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="All">All Categories</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Language">Language</option>
        </select>
        
        <select 
          className="border rounded py-2 px-3"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="All">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="draft">Draft</option>
        </select>
        
        <select 
          className="border rounded py-2 px-3"
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="All">All Question Types</option>
          <option value="multiple">Multiple Choice</option>
          <option value="essay">Essay</option>
          <option value="matching">Matching</option>
          <option value="shortanswer">Short Answer</option>
        </select>
        
        <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Apply Filters
        </button>
      </div>

      <div className="overflow-x-auto" ref={dropdownRef}>
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b px-2 py-2 text-center">
                <input 
                  type="checkbox"
                  className="h-4 w-4"
                  onChange={handleSelectAll}
                  checked={selectedQuestions.length === questions.length && questions.length > 0}
                />
              </th>
              <th className="border-b px-4 py-2 text-left font-medium text-blue-500">
                <div className="flex items-center">
                  <span>T</span>
                  <span className="text-gray-500">▲</span>
                  <span className="ml-2">Actions</span>
                </div>
              </th>
              <th className="border-b px-4 py-2 text-left font-medium ">
                <div>
                  Question
                  <div className="text-xs font-normal text-gray-600">
                    Question name / ID number
                  </div>
                </div>
              </th>
              <th className="border-b px-4 py-2 text-left font-medium">
                Status
              </th>
              <th className="border-b px-4 py-2 text-left font-medium">
                Version
              </th>
              <th className="border-b px-4 py-2 text-left font-medium">
                <div>
                  Created by
                  <div className="text-xs font-normal text-blue-500">
                    First name / Surname / Date
                  </div>
                </div>
              </th>
              <th className="border-b px-4 py-2 text-center font-medium">
                Comments
              </th>
              <th className="border-b px-4 py-2 text-center font-medium">
                Usage
              </th>
              <th className="border-b px-4 py-2 text-left font-medium ">
                <div className="flex items-center">
                  Last used
                  <span className="ml-2 text-blue-500 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">?</span>
                </div>
              </th>
              <th className="border-b px-4 py-2 text-left font-medium ">
                <div>
                  Modified by
                  <div className="text-xs font-normal text-blue-500">
                    First name / Surname / Date
                  </div>
                </div>
              </th>
            </tr>
          </thead>
              <tbody>
        {paginatedQuestions.map((question, index) => (
          <tr key={question.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="border-b px-2 py-3 text-center">
              <input 
                type="checkbox"
                className="h-4 w-4"
                checked={selectedQuestions.includes(question.id)}
                onChange={() => toggleQuestionSelection(question.id)}
              />
            </td>
                <td className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-center text-2xl">{getQuestionTypeIcon(question.questionType)}</span>
                    <div className="relative">
                      <button 
                        className="text-blue-500 hover:underline flex items-center"
                        onClick={() => setOpenActionDropdown(openActionDropdown === question.id ? null : question.id)}
                      >
                        Edit <ChevronDown size={14} className="ml-1" />
                      </button>
                      
                      {openActionDropdown === question.id && (
                        <div className="absolute left-0 mt-1 w-40 bg-white rounded shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => {
                              setPreviewQuestion(question);
                              setOpenActionDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                          >
                            <Eye size={14} className="mr-2" />
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              startEditingTitle(question);
                              setOpenActionDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                          >
                            <Edit size={14} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => duplicateQuestion(question)}
                            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                          >
                            <Copy size={14} className="mr-2" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              setHistoryModal(question);
                              setOpenActionDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                          >
                            <Clock size={14} className="mr-2" />
                            History
                          </button>
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                          >
                            <Trash size={14} className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                            <td className="border-b px-4 py-3 ">
                {showQuestionText && (
                  editingQuestion === question.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        autoFocus
                        onBlur={() => initiateQuestionSave(question.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') initiateQuestionSave(question.id);
                          if (e.key === 'Escape') setEditingQuestion(null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>{question.title}</span>
                      <button 
                        className="text-gray-700"
                        onClick={() => startEditingTitle(question)}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  )
                )}
              </td>
                <td className="border-b px-4 py-3">
                  <div className="relative">
                    <button 
                      className="border rounded px-3 py-1 bg-white flex items-center"
                      onClick={() => setOpenStatusDropdown(openStatusDropdown === question.id ? null : question.id)}
                    >
                      {question.status === 'ready' ? 'Ready' : 'Draft'} <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    {openStatusDropdown === question.id && (
                      <div className="absolute left-0 mt-1 w-32 bg-white rounded shadow-lg z-10 border border-gray-200">
                        <button
                          onClick={() => changeStatus(question.id, 'ready')}
                          className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                        >
                          <CheckCircle size={14} className="mr-2 text-green-600" />
                          Ready
                        </button>
                        <button
                          onClick={() => changeStatus(question.id, 'draft')}
                          className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                        >
                          <AlertTriangle size={14} className="mr-2 text-amber-600" />
                          Draft
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border-b px-4 py-3">
                  {question.version}
                </td>
                <td className="border-b px-4 py-3">
                  <div>
                    <div>{question.createdBy.name}</div>
                    <div className="text-gray-600">{question.createdBy.role}</div>
                    <div className="text-xs text-gray-600">{question.createdBy.date}</div>
                  </div>
                </td>
                <td className="border-b px-4 py-3 text-center text-blue-500 font-medium">
                  <button
                    onClick={() => alert(`View ${question.comments} comments for this question`)}
                    className="hover:underline focus:outline-none"
                  >
                    {question.comments}
                  </button>
                </td>
                <td className="border-b px-4 py-3 text-center text-blue-500 font-medium">
                  <button
                    onClick={() => alert(`This question is used in ${question.usage} quizzes`)}
                    className="hover:underline focus:outline-none"
                  >
                    {question.usage}
                  </button>
                </td>
                <td className="border-b px-4 py-3 ">
                  {question.lastUsed}
                </td>
                <td className="border-b px-4 py-3 ">
                  <div>
                    <div>{question.modifiedBy.name}</div>
                    <div className="text-gray-600">{question.modifiedBy.role}</div>
                    <div className="text-xs text-gray-600">{question.modifiedBy.date}</div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
      Showing {filteredQuestions.length === 0 ? 0 : startIdx + 1} to {Math.min(endIdx, filteredQuestions.length)} of {filteredQuestions.length} questions
    </div>
       <div className="flex gap-2">
      <button
        className="px-3 py-1 border rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>
      <button
        className="px-3 py-1 border rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        disabled={endIdx >= filteredQuestions.length}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
      </div>

     

      {/* Modals */}
       
      {showSaveConfirm && (
        <SaveConfirmationModal
          questionId={editingQuestion}
          onConfirm={confirmSave}
          onCancel={cancelSave}
        />
      )}
      {previewQuestion && (
        <PreviewModal 
          question={previewQuestion} 
          onClose={() => setPreviewQuestion(null)} 
        />
      )}
      
      {historyModal && (
        <HistoryModal 
          question={historyModal} 
          onClose={() => setHistoryModal(null)} 
        />
      )}
    </div>
  );
};

export default QuestionBank;