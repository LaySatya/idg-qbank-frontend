// import React, { useState, useMemo } from 'react';
// import { 
//   Search, ChevronDown, Edit, Trash, Copy, Eye, 
//   MessageCircle, Clock, CheckCircle, AlertTriangle, 
//   FileText, Info, X, PlusCircle, Upload, Download
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import XMLQuestionImporter from './XMLQuestionImporter';
// import BulkEditModal from './modals/BulkEditModal';
// import VersionHistoryModal from './modals/VersionHistoryModal';
// import QuestionPreviewModal from './modals/QuestionPreviewModal';
// import { getTypeColor, getDifficultyColor, exportToXML } from '../utils/questionUtils';

// const QuestionBank = () => {
//   const navigate = useNavigate();
  
//   // Initial mock data
//   const initialQuestions = [
//     {
//       id: 1,
//       questiontext: "What is the primary concept of Object-Oriented Programming?",
//       category: "Computer Science",
//       type: "Multiple Choice",
//       difficulty: "Medium",
//       status: "draft",
//       tags: ["OOP", "Programming Concepts"],
//       updated: "2025-04-28",
//       options: ["Inheritance", "Encapsulation", "Polymorphism", "All of the above"],
//       correctAnswer: "All of the above",
//       versions: [
//         { id: 1, date: "2025-04-28", author: "Prof. Smith", changes: "Initial creation" }
//       ],
//       comments: [],
//       usage: {
//         quizCount: 3,
//         lastUsed: "2025-04-15",
//         facilityIndex: 0.65,
//         discriminativeEfficiency: 0.42
//       },
//       needsChecking: false
//     },
//     {
//       id: 2,
//       questiontext: "What is a closure in JavaScript?",
//       category: "Web Development",
//       type: "Short Answer",
//       difficulty: "Hard",
//       status: "ready",
//       tags: ["JavaScript", "Advanced Concepts"],
//       updated: "2025-05-01",
//       correctAnswer: "A closure is a function that has access to variables in its outer (enclosing) lexical scope.",
//       versions: [
//         { id: 1, date: "2025-05-01", author: "Dr. Williams", changes: "Initial creation" }
//       ],
//       comments: [],
//       usage: {
//         quizCount: 1,
//         lastUsed: "2025-05-10",
//         facilityIndex: 0.55,
//         discriminativeEfficiency: 0.38
//       },
//       needsChecking: true
//     }
//   ];

//   // State Management
//   const [currentView, setCurrentView] = useState('questionBank'); // 'questionBank' or 'importer'
//   const [questions, setQuestions] = useState(initialQuestions);
//   const [selectedQuestions, setSelectedQuestions] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filters, setFilters] = useState({
//     category: 'All',
//     difficulty: 'All',
//     type: 'All',
//     status: 'All'
//   });
//   const [previewQuestion, setPreviewQuestion] = useState(null);
//   const [versionHistory, setVersionHistory] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [bulkEditModal, setBulkEditModal] = useState({ isOpen: false, questions: [] });
//   const [openActionDropdown, setOpenActionDropdown] = useState(null);
//   const questionsPerPage = 10;

//   // Handle importing questions from XML
//   const handleImportQuestions = (importedQuestions) => {
//     setQuestions(prev => [...prev, ...importedQuestions]);
//     setCurrentView('questionBank');
//     alert(`Successfully imported ${importedQuestions.length} questions!`);
//   };

//   // Select all questions
//   const handleSelectAll = (e) => {
//     if (e.target.checked) {
//       setSelectedQuestions(filteredQuestions.map(q => q.id));
//     } else {
//       setSelectedQuestions([]);
//     }
//   };

//   // Toggle individual question selection
//   const toggleQuestionSelection = (id) => {
//     setSelectedQuestions(prev => 
//       prev.includes(id) 
//         ? prev.filter(qId => qId !== id) 
//         : [...prev, id]
//     );
//   };

//   // Bulk actions
//   const handleBulkDelete = () => {
//     if (window.confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) {
//       setQuestions(prev => 
//         prev.filter(q => !selectedQuestions.includes(q.id))
//       );
//       setSelectedQuestions([]);
//     }
//   };

//   const handleBulkEdit = () => {
//     const selectedQuestionData = questions.filter(q => selectedQuestions.includes(q.id));
//     // Open bulk edit modal
//     setBulkEditModal({ isOpen: true, questions: selectedQuestionData });
//   };

//   const handleBulkDuplicate = () => {
//     const duplicatedQuestions = selectedQuestions.map(id => {
//       const originalQuestion = questions.find(q => q.id === id);
//       return {
//         ...originalQuestion,
//         id: Date.now() + Math.random(),
//         questiontext: `Copy of: ${originalQuestion.questiontext}`,
//         status: 'draft',
//         versions: [
//           ...(originalQuestion.versions || []),
//           { 
//             id: Date.now(), 
//             date: new Date().toISOString().split('T')[0], 
//             author: 'Current User', 
//             changes: 'Duplicated question' 
//           }
//         ]
//       };
//     });

//     setQuestions(prev => [...prev, ...duplicatedQuestions]);
//     setSelectedQuestions([]);
//   };

//   // Handle export to XML
//   const handleExportToXML = () => {
//     const selectedQuestionData = questions.filter(q => selectedQuestions.includes(q.id));
//     exportToXML(selectedQuestionData);
//   };

//   // Handle bulk edit save
//   const handleBulkEditSave = (questionIds, updates) => {
//     setQuestions(prev => 
//       prev.map(question => {
//         if (questionIds.includes(question.id)) {
//           const updatedQuestion = { ...question };
          
//           // Apply updates
//           Object.keys(updates).forEach(key => {
//             if (key === 'tags') {
//               // For tags, add new ones to existing ones
//               updatedQuestion.tags = [...new Set([...question.tags, ...updates.tags])];
//             } else {
//               updatedQuestion[key] = updates[key];
//             }
//           });
          
//           // Add version history entry
//           updatedQuestion.versions = [
//             ...question.versions,
//             {
//               id: Date.now(),
//               date: new Date().toISOString().split('T')[0],
//               author: 'Current User',
//               changes: 'Bulk edit applied'
//             }
//           ];
          
//           return updatedQuestion;
//         }
//         return question;
//       })
//     );
    
//     setSelectedQuestions([]);
//   };

//   // Filtering and Pagination
//   const filteredQuestions = useMemo(() => {
//     return questions.filter(q => {
//       const matchesSearch = searchQuery === '' || 
//         q.questiontext.toLowerCase().includes(searchQuery.toLowerCase());
      
//       const matchesCategory = filters.category === 'All' || 
//         q.category === filters.category;
      
//       const matchesDifficulty = filters.difficulty === 'All' || 
//         q.difficulty === filters.difficulty;
      
//       const matchesType = filters.type === 'All' || 
//         q.type === filters.type;
      
//       const matchesStatus = filters.status === 'All' || 
//         q.status === filters.status;
      
//       return matchesSearch && 
//              matchesCategory && 
//              matchesDifficulty && 
//              matchesType && 
//              matchesStatus;
//     });
//   }, [questions, searchQuery, filters]);

//   // Paginated Questions
//   const paginatedQuestions = useMemo(() => {
//     const startIndex = (currentPage - 1) * questionsPerPage;
//     const endIndex = startIndex + questionsPerPage;
//     return filteredQuestions.slice(startIndex, endIndex);
//   }, [filteredQuestions, currentPage]);

//   // Render based on current view
//   if (currentView === 'importer') {
//     return (
//       <XMLQuestionImporter 
//         onImport={handleImportQuestions}
//         onCancel={() => setCurrentView('questionBank')}
//       />
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto p-4">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {/* Header with Add Question Button */}
//         <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//           <h1 className="text-xl font-bold text-gray-800">Question Bank</h1>
//           <div className="flex gap-2">
//             <button 
//               onClick={() => setCurrentView('importer')}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors duration-200"
//             >
//               <Upload size={18} />
//               <span>Import XML</span>
//             </button>
//             <button 
//               onClick={() => {/* Handle add question */}}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors duration-200"
//             >
//               <PlusCircle size={18} />
//               <span>Add Question</span>
//             </button>
//           </div>
//         </div>

//         {/* Bulk Actions Bar */}
//         {selectedQuestions.length > 0 && (
//           <div className="bg-blue-50 p-4 flex justify-between items-center">
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-blue-800">
//                 {selectedQuestions.length} questions selected
//               </span>
//               <button 
//                 onClick={handleBulkEdit}
//                 className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center space-x-1"
//               >
//                 <Edit size={14} />
//                 <span>Edit</span>
//               </button>
//               <button 
//                 onClick={handleBulkDelete}
//                 className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 flex items-center space-x-1"
//               >
//                 <Trash size={14} />
//                 <span>Delete</span>
//               </button>
//               <button 
//                 onClick={handleBulkDuplicate}
//                 className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center space-x-1"
//               >
//                 <Copy size={14} />
//                 <span>Duplicate</span>
//               </button>
//               <button 
//                 onClick={handleExportToXML}
//                 className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 flex items-center space-x-1"
//               >
//                 <Download size={14} />
//                 <span>Export XML</span>
//               </button>
//             </div>
//             <button 
//               onClick={() => setSelectedQuestions([])}
//               className="text-sm text-blue-600 hover:underline"
//             >
//               Clear Selection
//             </button>
//           </div>
//         )}

//         {/* Search and Filters */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex flex-col sm:flex-row gap-3">
//             {/* Search Input */}
//             <div className="relative flex-grow">
//               <input 
//                 type="text"
//                 className="w-full px-4 py-2 pl-10 pr-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                 placeholder="Search questions..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Search size={18} className="text-gray-400" />
//               </div>
//             </div>

//             {/* Filters */}
//             <div className="flex gap-2">
//               {/* Category Filter */}
//               <select
//                 className="border border-gray-300 rounded px-3 py-2"
//                 value={filters.category}
//                 onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
//               >
//                 <option value="All">All Categories</option>
//                 <option value="Computer Science">Computer Science</option>
//                 <option value="Web Development">Web Development</option>
//                 <option value="Imported">Imported</option>
//               </select>

//               {/* Difficulty Filter */}
//               <select
//                 className="border border-gray-300 rounded px-3 py-2"
//                 value={filters.difficulty}
//                 onChange={(e) => setFilters(prev => ({...prev, difficulty: e.target.value}))}
//               >
//                 <option value="All">Filter by Tag...</option>
//                 <option value="Easy">Easy</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Hard">Hard</option>
//               </select>

//               {/* Status Filter */}
//               <select
//                 className="border border-gray-300 rounded px-3 py-2"
//                 value={filters.status}
//                 onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
//               >
//                 <option value="All">All Statuses</option>
//                 <option value="draft">Draft</option>
//                 <option value="ready">Ready</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Questions Table */}
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="w-12 px-6 py-3">
//                   <input 
//                     type="checkbox"
//                     className="form-checkbox h-4 w-4 text-blue-600"
//                     checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
//                     onChange={handleSelectAll}
//                   />
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div className="flex items-center">
//                     Comments
//                     <Info size={12} className="ml-1 text-blue-500" />
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Version
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div className="flex items-center">
//                     Usage
//                     <Info size={12} className="ml-1 text-blue-500" />
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div className="flex items-center">
//                     Last used
//                     <Info size={12} className="ml-1 text-blue-500" />
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div>
//                     Created by
//                     <div className="text-xs font-normal text-gray-400 mt-1">
//                       First name / Last name / Date
//                     </div>
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div>
//                     Modified by
//                     <div className="text-xs font-normal text-gray-400 mt-1">
//                       First name / Last name / Date
//                     </div>
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   <div className="flex items-center">
//                     Question
//                     <div className="text-xs font-normal text-gray-400 mt-1">
//                       Question name / ID number
//                     </div>
//                   </div>
//                 </th>
//                 <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {paginatedQuestions.map(question => (
//                 <tr key={question.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4">
//                     <input 
//                       type="checkbox"
//                       className="form-checkbox h-4 w-4 text-blue-600"
//                       checked={selectedQuestions.includes(question.id)}
//                       onChange={() => toggleQuestionSelection(question.id)}
//                     />
//                   </td>
//                   <td className="px-3 py-3 text-center">
//                     <span className="text-xs text-gray-600">
//                       {question.status === 'draft' ? '0' : '1'}
//                     </span>
//                   </td>
//                   <td className="px-3 py-3 text-center">
//                     <span className="text-xs text-gray-600">
//                       {question.comments?.length || 0}
//                     </span>
//                   </td>
//                   <td className="px-3 py-3 text-center">
//                     <span className="text-xs text-gray-600">
//                       v{question.versions.length}
//                     </span>
//                   </td>
//                   <td className="px-3 py-3 text-center">
//                     <span className="text-xs text-gray-600">
//                       {question.usage.quizCount}
//                     </span>
//                   </td>
//                   <td className="px-3 py-3">
//                     <div className="text-xs text-gray-600">
//                       {question.usage.lastUsed ? (
//                         <>
//                           {new Date(question.usage.lastUsed).toLocaleDateString('en-US', { 
//                             weekday: 'long', 
//                             year: 'numeric', 
//                             month: 'long', 
//                             day: 'numeric' 
//                           })}, {new Date(question.usage.lastUsed).toLocaleTimeString('en-US', {
//                             hour: 'numeric',
//                             minute: '2-digit',
//                             hour12: true
//                           })}
//                         </>
//                       ) : 'Never'}
//                     </div>
//                   </td>
//                   <td className="px-3 py-3">
//                     <div className="text-xs text-gray-600">
//                       {question.versions[0]?.author || 'piseth seng'}
//                       <div className="text-xs">
//                         {question.updated}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-3 py-3">
//                     <div className="text-xs text-gray-600">
//                       {question.versions[question.versions.length - 1]?.author || 'piseth seng'}
//                       <div className="text-xs">
//                         {question.versions[question.versions.length - 1]?.date || question.updated}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-3 py-3">
//                     <div className="max-w-lg">
//                       {question.needsChecking && (
//                         <div className="flex items-center text-red-600 text-xs mb-1">
//                           <AlertTriangle size={12} className="mr-1" />
//                           Needs checking
//                         </div>
//                       )}
//                       <div className="flex items-center gap-2">
//                         <span className="inline-flex items-center">
//                           <Info size={12} className="text-blue-500" />
//                         </span>
//                         <button className="text-blue-600 hover:underline">
//                           <Edit size={12} className="inline mr-1" />
//                           Edit
//                         </button>
//                       </div>
//                       <div className="text-sm text-gray-800 mt-1">
//                         {question.questiontext}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-3 py-3">
//                     <div className="flex items-center justify-end gap-2">
//                       <button className="flex items-center text-gray-600 hover:text-gray-800">
//                         <MessageCircle size={14} />
//                       </button>
//                       <div className="relative">
//                         <button 
//                           className="bg-white border border-gray-300 rounded px-3 py-1 text-sm flex items-center gap-1 hover:bg-gray-50 min-w-16"
//                           onClick={() => {
//                             // Toggle dropdown for this question
//                             const newOpenDropdown = openActionDropdown === question.id ? null : question.id;
//                             setOpenActionDropdown(newOpenDropdown);
//                           }}
//                         >
//                           Edit
//                           <ChevronDown size={12} />
//                         </button>
//                         {openActionDropdown === question.id && (
//                           <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-48">
//                             <div className="py-1">
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   navigate('/question-editor', { state: { question } });
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <Eye size={14} className="mr-2" />
//                                 Edit question
//                               </button>
//                               <button
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   // Toggle status between draft and ready
//                                   const newStatus = question.status === 'draft' ? 'ready' : 'draft';
//                                   const updatedQuestion = {
//                                     ...question,
//                                     status: newStatus,
//                                     versions: [
//                                       ...question.versions,
//                                       { 
//                                         id: Date.now(), 
//                                         date: new Date().toISOString().split('T')[0], 
//                                         author: 'Current User', 
//                                         changes: `Changed status to ${newStatus}` 
//                                       }
//                                     ]
//                                   };
//                                   setQuestions(prev => 
//                                     prev.map(q => q.id === question.id ? updatedQuestion : q)
//                                   );
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <CheckCircle size={14} className="mr-2" />
//                                 Mark as {question.status === 'draft' ? 'Ready' : 'Draft'}
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   const duplicatedQuestion = {
//                                     ...question,
//                                     id: Date.now(),
//                                     status: 'draft',
//                                     versions: [
//                                       ...question.versions,
//                                       { 
//                                         id: Date.now(), 
//                                         date: new Date().toISOString().split('T')[0], 
//                                         author: 'Current User', 
//                                         changes: 'Duplicated question' 
//                                       }
//                                     ]
//                                   };
//                                   setQuestions(prev => [...prev, duplicatedQuestion]);
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <Copy size={14} className="mr-2" />
//                                 Duplicate
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => setOpenActionDropdown(null)}
//                               >
//                                 <FileText size={14} className="mr-2" />
//                                 Manage tags
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   setPreviewQuestion(question);
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <Eye size={14} className="mr-2" />
//                                 Preview
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   setVersionHistory(question);
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <Clock size={14} className="mr-2" />
//                                 History
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => {
//                                   if (window.confirm('Are you sure you want to delete this question?')) {
//                                     setQuestions(prev => prev.filter(q => q.id !== question.id));
//                                   }
//                                   setOpenActionDropdown(null);
//                                 }}
//                               >
//                                 <Trash size={14} className="mr-2" />
//                                 Delete
//                               </button>
//                               <button 
//                                 className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                                 onClick={() => setOpenActionDropdown(null)}
//                               >
//                                 <Download size={14} className="mr-2" />
//                                 Export as Moodle XML
//                               </button>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="px-6 py-3 flex justify-between items-center border-t border-gray-200 bg-gray-50">
//           <div className="text-sm text-gray-700">
//             Showing{' '}
//             <span className="font-medium">
//               {filteredQuestions.length > 0 ? (currentPage - 1) * questionsPerPage + 1 : 0}
//             </span>{' '}
//             to{' '}
//             <span className="font-medium">
//               {Math.min(currentPage * questionsPerPage, filteredQuestions.length)}
//             </span>{' '}
//             of{' '}
//             <span className="font-medium">
//               {filteredQuestions.length}
//             </span>{' '}
//             questions
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//               disabled={currentPage === 1}
//               className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//             >
//               Previous
//             </button>
//             <button
//               onClick={() => setCurrentPage(prev => prev + 1)}
//               disabled={currentPage === Math.ceil(filteredQuestions.length / questionsPerPage) || filteredQuestions.length === 0}
//               className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </div>

//         {/* Modals */}
//         {previewQuestion && (
//           <QuestionPreviewModal 
//             question={previewQuestion} 
//             onClose={() => setPreviewQuestion(null)} 
//           />
//         )}

//         {versionHistory && (
//           <VersionHistoryModal 
//             question={versionHistory} 
//             onClose={() => setVersionHistory(null)} 
//           />
//         )}

//         {bulkEditModal.isOpen && (
//           <BulkEditModal 
//             questions={bulkEditModal.questions}
//             onClose={() => setBulkEditModal({ isOpen: false, questions: [] })}
//             onSave={handleBulkEditSave}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuestionBank;