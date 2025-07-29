// // ============================================================================
// // components/questions/CreateMultipleChoiceQuestion.jsx - UPDATED WITH ENHANCED BULK EDIT
// // ============================================================================
//  import { useMemo } from "react";
// import React, { useState, useEffect } from 'react';
// import { X, Save, ChevronDown, AlertCircle, Layers } from 'lucide-react';
// import { useMultipleChoiceForm } from '../../hooks/useMultipleChoiceForm';
// import { useEnhancedBulkEdit } from '../../hooks/useEnhancedBulkEdit';
// import GlobalBulkEditPanel from "../shared/GlobalBulkEditPanel";
// import ReactModal from 'react-modal';
// import {
//   TagDropdown,
//   TextEditor,
//   FormField,
//   NumberInput,
//   RadioGroup,
//   Checkbox,
//   Select,
//   ValidationErrors
// } from "../shared/SharedComponents";
// import QuestionSettings from '../shared/QuestionSettings';
// import ChoiceEditor from '../shared/ChoiceEditor';
// import GradingInfo from '../shared/GradingInfo';
// import { AVAILABLE_TAGS, GRADE_OPTIONS } from "../../../../shared/constants/questionConstants";
// import questionAPI from "../../../../api/questionAPI";

// const CreateMultipleChoiceQuestion = ({ 
//   question = {}, 
//   questions, 
//   onClose, 
//   onSave, 
//   isBulk 
// }) => {
//   useEffect(() => {
//   console.log("Choices in edit modal:", question.choices);
// }, [question.choices]);

//   const questionsToEdit = useMemo(
//     () => questions || (question ? [question] : []),
//     [questions, question]
//   );

//   // Single question form logic
//   const {
//     formData,
//     errors,
//     updateField,
//     updateChoice,
//     addChoice,
//     removeChoice,
//     handleTagToggle,
//     validate,
//     resetForm
//   } = useMultipleChoiceForm(question);

//   // Enhanced bulk edit logic
//     // After your other hooks:
//   const {
//     bulkQuestions,
//     bulkTagDropdowns,
//     handleBulkChange,
//     handleBulkChoiceChange,
//     handleBulkTagToggle,
//     onToggleBulkTagDropdown: toggleBulkTagDropdown,
//     globalBulkChanges,
//     pendingChanges,
//     handleGlobalBulkChange,
//     handleGlobalTagOperation,
//     applyGlobalBulkChanges
//   } = useEnhancedBulkEdit(questionsToEdit, isBulk);
//   const [expandedSections, setExpandedSections] = useState({
//     general: true,
//     answers: true,
//     combinedFeedback: false,
//     multipleTries: false,
//     tags: false
//   });
//   const [allExpanded, setAllExpanded] = useState(false);
  
//   // New state for bulk edit mode toggle
//   const [bulkEditMode, setBulkEditMode] = useState('global'); // 'global' or 'individual'
//  const [allTags, setAllTags] = useState([]);

//   useEffect(() => {
//     questionAPI.getTags().then(setAllTags);
//   }, []);
//   // Reset form when question changes
//   useEffect(() => {
//     resetForm(question);
//   }, [question.id, isBulk, resetForm]);

//   const toggleSection = (section) => {
//     setExpandedSections(prev => ({
//       ...prev,
//       [section]: !prev[section]
//     }));
//   };

//   const handleExpandAll = () => {
//     const newExpandedState = !allExpanded;
//     setAllExpanded(newExpandedState);
//     setExpandedSections({
//       general: newExpandedState,
//       answers: newExpandedState,
//       combinedFeedback: newExpandedState,
//       multipleTries: newExpandedState,
//       tags: newExpandedState
//     });
//   };

//   // Save handlers
//   const handleSingleSave = () => {
//     if (!validate()) return;
//     onSave(formData);
//     onClose();
//   };

//   const handleBulkSave = () => {
//     onSave(bulkQuestions);
//     onClose();
//   };

//   return (
// <ReactModal
//   isOpen={true}
//   onRequestClose={onClose}
//   contentLabel="Edit Multiple Choice Question"
//   style={{
//     overlay: {
//       zIndex: 1000,
//       backgroundColor: 'rgba(0,0,0,0.6)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center'
//     },
//     content: {
//       position: 'static',
//       inset: 'unset',
//       padding: 0,
//       border: 'none',
//       background: 'none',
//       overflow: 'visible',
//       maxWidth: '95vw',
//       width: '100%',
//       maxHeight: '95vh',
//       borderRadius: '20px',
//       boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
//       margin: 'auto'
//     }
//   }}
//   ariaHideApp={false}
// >
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-gray-200">
//         {/* Header */}
//         <Header 
//           isBulk={isBulk} 
//           hasExistingQuestion={question && question.id}
//           onClose={onClose}
//           onExpandAll={handleExpandAll}
//           allExpanded={allExpanded}
//           bulkEditMode={bulkEditMode}
//           setBulkEditMode={setBulkEditMode}
//           questionCount={bulkQuestions.length}
//         />

//         {/* Content */}
//         <div className="flex-grow overflow-y-auto">
//           <div className="p-6">
//             <div className="max-w-6xl mx-auto space-y-6">
//               {isBulk ? (
//                 <div className="space-y-8">
//                   {/* Bulk Edit Mode Toggle */}
//                   <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
//                     <span className="text-sm font-medium text-gray-700">Edit Mode:</span>
//                     <div className="flex bg-white rounded-lg p-1 border border-gray-200">
//                       <button
//                         onClick={() => setBulkEditMode('global')}
//                         className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                           bulkEditMode === 'global'
//                             ? 'bg-blue-600 text-white shadow-sm'
//                             : 'text-gray-700 hover:bg-gray-100'
//                         }`}
//                       >
//                         <div className="flex items-center space-x-2">
//                           <Layers size={16} />
//                           <span>Global Changes</span>
//                         </div>
//                       </button>
//                       <button
//                         onClick={() => setBulkEditMode('individual')}
//                         className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
//                           bulkEditMode === 'individual'
//                             ? 'bg-blue-600 text-white shadow-sm'
//                             : 'text-gray-700 hover:bg-gray-100'
//                         }`}
//                       >
//                         <div className="flex items-center space-x-2">
//                           <AlertCircle size={16} />
//                           <span>Individual Questions</span>
//                         </div>
//                       </button>
//                     </div>
//                   </div>
//                   {bulkEditMode === 'global' ? (
//                     <GlobalBulkEditPanel
//                       globalBulkChanges={globalBulkChanges}
//                       pendingChanges={pendingChanges}
//                       onGlobalBulkChange={handleGlobalBulkChange}
//                       onGlobalTagOperation={handleGlobalTagOperation}
//                       onApplyGlobalChanges={applyGlobalBulkChanges}
//                       questionCount={bulkQuestions.length}
//                       selectedQuestions={bulkQuestions}   
//                     />
//                   ) : (
//                     <BulkEditForm
//                       questions={bulkQuestions}
//                       tagDropdowns={bulkTagDropdowns}
//                       onBulkChange={handleBulkChange}
//                       onBulkChoiceChange={handleBulkChoiceChange}
//                       onBulkTagToggle={handleBulkTagToggle}
//                       onToggleBulkTagDropdown={toggleBulkTagDropdown}
//                       onBulkAddChoice={handleBulkAddChoice}
//                       onBulkRemoveChoice={handleBulkRemoveChoice}
//                     />
//                   )}
//                 </div>
//               ) : (
//                 <SingleEditForm
//                   formData={formData}
//                   errors={errors}
//                   onUpdateField={updateField}
//                   onUpdateChoice={updateChoice}
//                   onAddChoice={addChoice}
//                   onRemoveChoice={removeChoice}
//                   onTagToggle={handleTagToggle}
//                   expandedSections={expandedSections}
//                   onToggleSection={toggleSection}
//                   allTags={allTags} 
//                 />
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <Footer 
//           onClose={onClose}
//           onSave={isBulk ? handleBulkSave : handleSingleSave}
//           isBulk={isBulk}
//         />
//       </div>
//     </ReactModal>
//   );
// };

// // Header Component - Updated
// const Header = ({ 
//   isBulk, 
//   hasExistingQuestion, 
//   onClose, 
//   onExpandAll, 
//   allExpanded, 
//   bulkEditMode, 
//   setBulkEditMode, 
//   questionCount 
// }) => (
//   <div className="p-4 border-b border-gray-200 bg-gray-50">
//     <div className="flex justify-between items-start">
//       <div>
//         <h1 className="text-xl font-semibold text-gray-900 flex items-center">
//           {isBulk
//             ? `Bulk Edit Multiple Choice Questions (${questionCount} selected)`
//             : (hasExistingQuestion ? 'Edit Multiple Choice Question' : 'Adding a Multiple choice question')}
//           <span className="ml-2 text-blue-500 cursor-help" title="Help">ⓘ</span>
//         </h1>
//         {isBulk && (
//           <p className="text-sm text-gray-600 mt-1">
//             {bulkEditMode === 'global' 
//               ? 'Apply changes to all questions at once' 
//               : 'Edit each question individually'}
//           </p>
//         )}
//       </div>
//       <div className="flex items-center space-x-3">
//         {isBulk && bulkEditMode === 'individual' && (
//           <button 
//             onClick={onExpandAll}
//             className="text-blue-600 hover:text-blue-800 underline text-sm transition-colors"
//           >
//             {allExpanded ? 'Collapse all sections' : 'Expand all sections'}
//           </button>
//         )}
//         <button 
//           onClick={onClose} 
//           className="text-gray-400 hover:text-gray-600 transition-colors"
//         >
//           <X size={20} />
//         </button>
//       </div>
//     </div>
//   </div>
// );

// // Footer Component - Updated
// const Footer = ({ onClose, onSave, isBulk }) => (
//   <div className="p-6 border-t border-gray-200 bg-gray-50">
//     <div className="flex justify-between items-center">
//       <div className="flex items-center text-sm text-red-600">
//         <AlertCircle size={16} className="mr-1" />
//         Required
//       </div>
//       <div className="flex space-x-3">
//         {!isBulk && (
//           <button
//             onClick={onSave}
//             className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
//           >
//             Save changes and continue editing
//           </button>
//         )}
//         <button
//           onClick={onSave}
//           className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
//         >
//           Save changes
//         </button>
//         <button
//           onClick={onClose}
//           className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   </div>
// );

// // Section Header Component
// const SectionHeader = ({ title, isExpanded, onToggle, required = false }) => (
//   <button
//     onClick={onToggle}
//     className="w-full flex items-center justify-between py-2 text-left border-b border-gray-200"
//   >
//     <div className="flex items-center space-x-2">
//       <ChevronDown 
//         size={16} 
//         className={`transform transition-transform duration-200 ${
//           isExpanded ? 'rotate-0' : '-rotate-90'
//         }`}
//       />
//       <h3 className="text-lg font-medium text-gray-900">
//         {title}
//         {required && <span className="text-red-500 ml-1">*</span>}
//       </h3>
//     </div>
//   </button>
// );

// // Single Edit Form Component (unchanged from original)
// const SingleEditForm = ({
//   formData,
//   errors,
//   onUpdateField,
//   onUpdateChoice,
//   onAddChoice,
//   onRemoveChoice,
//   onTagToggle,
//   expandedSections,
//   onToggleSection,
//   allTags
// }) => {
//   const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

//   return (
//     <div className="space-y-6">
//       {/* Validation errors */}
//       <ValidationErrors errors={errors} />

//       {/* General Section */}
//       <div className="space-y-4">
//         <SectionHeader
//           title="General"
//           isExpanded={expandedSections.general}
//           onToggle={() => onToggleSection('general')}
//           required={true}
//         />
        
//         {expandedSections.general && (
//           <div className="space-y-6 pt-4">
//             {/* Category */}
//             <FormField label="Category">
//               <Select
//                 value="Default for P-test (8)"
//                 onChange={() => {}}
//                 options={[{ value: "Default for P-test (8)", label: "Default for P-test" }]}
//                 className="w-full max-w-md"
//               />
//             </FormField>

//             {/* Question Name */}
//             <FormField label="Question name" required error={errors.title}>
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={formData.title}
//                   onChange={e => onUpdateField('title', e.target.value)}
//                   className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                     errors.title ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                   placeholder=""
//                 />
//                 {errors.title && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
//               </div>
//             </FormField>

//             {/* Question Text */}
//             <FormField label="Question text" required error={errors.questionText}>
//               <div className="relative">
//                 <TextEditor
//                   value={formData.questionText}
//                   onChange={value => onUpdateField('questionText', value)}
//                   placeholder=""
//                   error={errors.questionText}
//                   minHeight="200px"
//                 />
//                 {errors.questionText && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
//               </div>
//             </FormField>

//             {/* Question Status, Default Mark, ID Number */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <FormField label="Question status">
//                 <Select
//                   value={formData.questionStatus || 'Draft'}
//                   onChange={value => onUpdateField('questionStatus', value)}
//                   options={[
//                     { value: 'Draft', label: 'Draft' },
//                     { value: 'Ready', label: 'Ready' }
//                   ]}
//                   className="w-full"
//                 />
//               </FormField>
              
//               <FormField label="Default mark" required error={errors.defaultMark}>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     value={formData.defaultMark}
//                     onChange={e => onUpdateField('defaultMark', Number(e.target.value))}
//                     className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                       errors.defaultMark ? 'border-red-500' : 'border-gray-300'
//                     }`}
//                     min="0"
//                     step="1"
//                   />
//                   {errors.defaultMark && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
//                 </div>
//               </FormField>

//               <FormField label="ID number">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={formData.idNumber || ''}
//                     onChange={e => onUpdateField('idNumber', e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder=""
//                   />
//                   <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help" title="Optional unique identifier">ⓘ</span>
//                 </div>
//               </FormField>
//             </div>

//             {/* General Feedback */}
//             <FormField label="General feedback">
//               <div className="relative">
//                 <TextEditor
//                   value={formData.generalFeedback}
//                   onChange={value => onUpdateField('generalFeedback', value)}
//                   placeholder=""
//                   minHeight="120px"
//                 />
//                 <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help" title="Feedback shown regardless of answer">ⓘ</span>
//               </div>
//             </FormField>

//             {/* One or Multiple Answers */}
//             <FormField label="One or multiple answers?">
//               <Select
//                 value={formData.multipleAnswers ? 'Multiple answers allowed' : 'One answer only'}
//                 onChange={value => onUpdateField('multipleAnswers', value === 'Multiple answers allowed')}
//                 options={[
//                   { value: 'One answer only', label: 'One answer only' },
//                   { value: 'Multiple answers allowed', label: 'Multiple answers allowed' }
//                 ]}
//                 className="w-full max-w-md"
//               />
//             </FormField>

//             {/* Shuffle and Number Choices */}
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   checked={formData.shuffleAnswers}
//                   onChange={checked => onUpdateField('shuffleAnswers', checked)}
//                   label="Shuffle the choices?"
//                 />
//                 <span className="text-blue-500 text-sm cursor-help" title="Randomize choice order">ⓘ</span>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <FormField label="Number the choices?">
//                   <div className="relative">
//                     <Select
//                       value={formData.numberChoices || '1, 2, 3, ...'}
//                       onChange={value => onUpdateField('numberChoices', value)}
//                       options={[
//                         { value: '1, 2, 3, ...', label: '1, 2, 3, ...' },
//                         { value: 'a, b, c, ...', label: 'a, b, c, ...' },
//                         { value: 'A, B, C, ...', label: 'A, B, C, ...' },
//                         { value: 'i, ii, iii, ...', label: 'i, ii, iii, ...' },
//                         { value: 'I, II, III, ...', label: 'I, II, III, ...' },
//                         { value: 'No numbers', label: 'No numbers' }
//                       ]}
//                       className="w-full"
//                     />
//                     <span className="absolute right-8 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
//                   </div>
//                 </FormField>

//                 <FormField label="Show standard instructions">
//                   <div className="relative">
//                     <Select
//                       value={formData.showInstructions ? 'Yes' : 'No'}
//                       onChange={value => onUpdateField('showInstructions', value === 'Yes')}
//                       options={[
//                         { value: 'No', label: 'No' },
//                         { value: 'Yes', label: 'Yes' }
//                       ]}
//                       className="w-full max-w-xs"
//                     />
//                     <span className="absolute right-8 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
//                   </div>
//                 </FormField>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Answers Section */}
//       <div className="space-y-4">
//         <SectionHeader
//           title="Answers"
//           isExpanded={expandedSections.answers}
//           onToggle={() => onToggleSection('answers')}
//           required={true}
//         />
        
//         {expandedSections.answers && (
//           <div className="pt-4">
//             <ChoiceEditor
//               choices={formData.choices}
//               onUpdateChoice={onUpdateChoice}
//               onAddChoice={onAddChoice}
//               onRemoveChoice={onRemoveChoice}
//               errors={errors.choices}
//               gradeOptions={GRADE_OPTIONS}
//             />
//           </div>
//         )}
//       </div>

//       {/* Combined Feedback Section */}
//       <div className="space-y-4">
//         <SectionHeader
//           title="Combined feedback"
//           isExpanded={expandedSections.combinedFeedback}
//           onToggle={() => onToggleSection('combinedFeedback')}
//         />
        
//         {expandedSections.combinedFeedback && (
//           <div className="pt-4 space-y-6">
//             <FormField label="For any correct response">
//               <TextEditor
//                 value={formData.combinedFeedback?.correct || 'Your answer is correct.'}
//                 onChange={value => onUpdateField('combinedFeedback', {
//                   ...formData.combinedFeedback,
//                   correct: value
//                 })}
//                 placeholder=""
//                 minHeight="120px"
//               />
//             </FormField>

//             <FormField label="For any partially correct response">
//               <TextEditor
//                 value={formData.combinedFeedback?.partiallyCorrect || 'Your answer is partially correct.'}
//                 onChange={value => onUpdateField('combinedFeedback', {
//                   ...formData.combinedFeedback,
//                   partiallyCorrect: value
//                 })}
//                 placeholder=""
//                 minHeight="120px"
//               />
//             </FormField>

//             <div className="space-y-2">
//               <label className="block text-sm text-gray-600">Options</label>
//               <Checkbox
//                 checked={formData.combinedFeedback?.showNumberCorrect || false}
//                 onChange={checked => onUpdateField('combinedFeedback', {
//                   ...formData.combinedFeedback,
//                   showNumberCorrect: checked
//                 })}
//                 label="Show the number of correct responses once the question has finished"
//               />
//             </div>

//             <FormField label="For any incorrect response">
//               <TextEditor
//                 value={formData.combinedFeedback?.incorrect || 'Your answer is incorrect.'}
//                 onChange={value => onUpdateField('combinedFeedback', {
//                   ...formData.combinedFeedback,
//                   incorrect: value
//                 })}
//                 placeholder=""
//                 minHeight="120px"
//               />
//             </FormField>
//           </div>
//         )}
//       </div>

//       {/* Multiple Tries Section */}
//       <div className="space-y-4">
//         <SectionHeader
//           title="Multiple tries"
//           isExpanded={expandedSections.multipleTries}
//           onToggle={() => onToggleSection('multipleTries')}
//         />
        
//         {expandedSections.multipleTries && (
//           <div className="pt-4 space-y-6">
//             <FormField label="Penalty for each incorrect try">
//               <div className="flex items-center space-x-2">
//                 <Select
//                   value={formData.penaltyFactor ? `${(formData.penaltyFactor * 100).toFixed(0)}%` : '0%'}
//                   onChange={value => onUpdateField('penaltyFactor', parseFloat(value) / 100)}
//                   options={[
//                     { value: '0%', label: '0%' },
//                     { value: '10%', label: '10%' },
//                     { value: '20%', label: '20%' },
//                     { value: '33.33333%', label: '33.33333%' },
//                     { value: '50%', label: '50%' }
//                   ]}
//                   className="w-32"
//                 />
//                 <span className="text-blue-500 text-sm cursor-help">ⓘ</span>
//               </div>
//             </FormField>

//             <FormField label="Hint 1">
//               <TextEditor
//                 value={formData.hint1 || ''}
//                 onChange={value => onUpdateField('hint1', value)}
//                 placeholder=""
//                 minHeight="120px"
//               />
//             </FormField>

//             <div className="ml-4 space-y-2">
//               <label className="block text-sm text-gray-600">Hint 1 options</label>
//               <div className="space-y-2">
//                 <Checkbox
//                   checked={formData.hint1ClearIncorrect || false}
//                   onChange={checked => onUpdateField('hint1ClearIncorrect', checked)}
//                   label="Clear incorrect responses"
//                 />
//                 <Checkbox
//                   checked={formData.hint1ShowNumCorrect || false}
//                   onChange={checked => onUpdateField('hint1ShowNumCorrect', checked)}
//                   label="Show the number of correct responses"
//                 />
//               </div>
//             </div>

//             <FormField label="Hint 2">
//               <TextEditor
//                 value={formData.hint2 || ''}
//                 onChange={value => onUpdateField('hint2', value)}
//                 placeholder=""
//                 minHeight="120px"
//               />
//             </FormField>

//             <div className="ml-4 space-y-2">
//               <label className="block text-sm text-gray-600">Hint 2 options</label>
//               <div className="space-y-2">
//                 <Checkbox
//                   checked={formData.hint2ClearIncorrect || false}
//                   onChange={checked => onUpdateField('hint2ClearIncorrect', checked)}
//                   label="Clear incorrect responses"
//                 />
//                 <Checkbox
//                   checked={formData.hint2ShowNumCorrect || false}
//                   onChange={checked => onUpdateField('hint2ShowNumCorrect', checked)}
//                   label="Show the number of correct responses"
//                 />
//               </div>
//             </div>

//             <button
//               type="button"
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
//             >
//               Add another hint
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Tags Section */}
//       <div className="space-y-4">
//         <SectionHeader
//           title="Tags"
//           isExpanded={expandedSections.tags}
//           onToggle={() => onToggleSection('tags')}
//           required={true}
//         />
        
//         {expandedSections.tags && (
//           <div className="pt-4">
//             <FormField label="Tags" required error={errors.tags}>
//             <TagDropdown
//               tags={formData.tags}
//               onTagToggle={onTagToggle}
//               isOpen={tagDropdownOpen}
//               onToggle={() => setTagDropdownOpen(open => !open)}
//               availableTags={allTags}
//               error={!!errors.tags}
//             />

//             </FormField>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Bulk Edit Form Component - Updated to show a summary when in individual mode
// const BulkEditForm = ({
//   questions,
//   tagDropdowns,
//   onBulkChange,
//   onBulkChoiceChange,
//   onBulkTagToggle,
//   onToggleBulkTagDropdown,
//   onBulkAddChoice,
//   onBulkRemoveChoice
// }) => {
//   // Individual section states for each question
//   const [questionSections, setQuestionSections] = useState(
//     questions.reduce((acc, _, idx) => ({
//       ...acc,
//       [idx]: {
//         general: true,
//         answers: true,
//         combinedFeedback: false,
//         multipleTries: false,
//         tags: false
//       }
//     }), {})
//   );

//   const toggleQuestionSection = (questionIdx, section) => {
//     setQuestionSections(prev => ({
//       ...prev,
//       [questionIdx]: {
//         ...prev[questionIdx],
//         [section]: !prev[questionIdx][section]
//       }
//     }));
//   };

//   return (
//     <div className="space-y-8">
//       {/* Summary Panel */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
//         <h3 className="text-lg font-semibold text-blue-900 mb-4">Individual Question Editing</h3>
//         <p className="text-blue-800 mb-4">
//           You are editing {questions.length} questions individually. Each question can be customized separately.
//         </p>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//           <div className="bg-white rounded-lg p-3">
//             <div className="font-medium text-gray-900">Questions</div>
//             <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
//           </div>
//           <div className="bg-white rounded-lg p-3">
//             <div className="font-medium text-gray-900">Avg. Default Mark</div>
//             <div className="text-2xl font-bold text-blue-600">
//               {Math.round(questions.reduce((sum, q) => sum + q.defaultMark, 0) / questions.length)}
//             </div>
//           </div>
//           <div className="bg-white rounded-lg p-3">
//             <div className="font-medium text-gray-900">Total Tags</div>
//             <div className="text-2xl font-bold text-blue-600">
//               {new Set(questions.flatMap(q => q.tags)).size}
//             </div>
//           </div>
//         </div>
//       </div>

//       {questions.map((q, idx) => (
//         <div key={`bulk-question-${q.id || idx}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
//           <div className="mb-6">
//             <h3 className="text-xl font-bold text-gray-900 mb-2">Question #{idx + 1}</h3>
//             <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-16"></div>
//           </div>
          
//           <div className="space-y-6">
//             {/* General Section */}
//             <div className="space-y-4">
//               <SectionHeader
//                 title="General"
//                 isExpanded={questionSections[idx]?.general ?? true}
//                 onToggle={() => toggleQuestionSection(idx, 'general')}
//                 required={true}
//               />
              
//               {(questionSections[idx]?.general ?? true) && (
//                 <div className="space-y-6 pt-4">
//                   {/* Category */}
//                   <FormField label="Category">
//                     <Select
//                       value="Default for P-test (8)"
//                       onChange={() => {}}
//                       options={[{ value: "Default for P-test (8)", label: "Default for P-test (8)" }]}
//                       className="w-full max-w-md"
//                     />
//                   </FormField>

//                   {/* Question Name */}
//                   <FormField label="Question name" required>
//                     <input
//                       type="text"
//                       value={q.title}
//                       onChange={e => onBulkChange(idx, 'title', e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder=""
//                     />
//                   </FormField>

//                   {/* Question Text */}
//                   <FormField label="Question text" required>
//                     <TextEditor
//                       value={q.questionText}
//                       onChange={value => onBulkChange(idx, 'questionText', value)}
//                       placeholder=""
//                       minHeight="200px"
//                     />
//                   </FormField>

//                   {/* Question Status, Default Mark, ID Number */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <FormField label="Question status">
//                       <Select
//                         value={q.questionStatus || 'Ready'}
//                         onChange={value => onBulkChange(idx, 'questionStatus', value)}
//                         options={[
//                           { value: 'Draft', label: 'Draft' },
//                           { value: 'Ready', label: 'Ready' }
//                         ]}
//                         className="w-full"
//                       />
//                     </FormField>
                    
//                     <FormField label="Default mark" required>
//                       <input
//                         type="number"
//                         value={q.defaultMark}
//                         onChange={e => onBulkChange(idx, 'defaultMark', Number(e.target.value))}
//                         className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         min="0"
//                         step="1"
//                       />
//                     </FormField>

//                     <FormField label="ID number">
//                       <div className="relative">
//                         <input
//                           type="text"
//                           value={q.idNumber || ''}
//                           onChange={e => onBulkChange(idx, 'idNumber', e.target.value)}
//                           className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder=""
//                         />
//                         <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
//                       </div>
//                     </FormField>
//                   </div>

//                   {/* Rest of the form sections remain the same as in the original... */}
//                   {/* For brevity, I'm not including all sections, but they would follow the same pattern */}
//                 </div>
//               )}
//             </div>

//             {/* Answers Section */}
//             <div className="space-y-4">
//               <SectionHeader
//                 title="Answers"
//                 isExpanded={questionSections[idx]?.answers ?? true}
//                 onToggle={() => toggleQuestionSection(idx, 'answers')}
//                 required={true}
//               />
              
//               {(questionSections[idx]?.answers ?? true) && (
//                 <div className="pt-4">
//                   <ChoiceEditor
//                     choices={q.choices}
//                     onUpdateChoice={(cIdx, field, value) => onBulkChoiceChange(idx, cIdx, field, value)}
//                     onAddChoice={() => onBulkAddChoice(idx)}
//                     onRemoveChoice={(cIdx) => onBulkRemoveChoice(idx, cIdx)}
//                     isBulk={true}
//                     gradeOptions={GRADE_OPTIONS}
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Tags Section */}
//             <div className="space-y-4">
//               <SectionHeader
//                 title="Tags"
//                 isExpanded={questionSections[idx]?.tags ?? false}
//                 onToggle={() => toggleQuestionSection(idx, 'tags')}
//                 required={true}
//               />
              
//               {(questionSections[idx]?.tags ?? false) && (
//                 <div className="pt-4">
//                   <FormField label="Tags" required>
//                   <TagDropdown
//                     tags={q.tags}
//                     onTagToggle={(tag) => onBulkTagToggle(idx, tag)}
//                     isOpen={!!tagDropdowns[idx]}
//                     onToggle={() => onToggleBulkTagDropdown(idx)}
//                     availableTags={allTags}
//                   />
//                   </FormField>
//                 </div>
//               )}
//             </div>

//             {/* Grading Info */}
//             <div className="mt-6">
//               <GradingInfo choices={q.choices} />
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default CreateMultipleChoiceQuestion;