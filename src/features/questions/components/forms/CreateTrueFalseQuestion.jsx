// components/questions/CreateTrueFalseQuestion.jsx
import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { X, Save, ChevronDown, AlertCircle } from 'lucide-react';

import { useTrueFalseForm } from '../../hooks/useTrueFalseForm';
import { useBulkTrueFalseEdit } from '../../hooks/useBulkTrueFalseEdit';
import GlobalBulkEditPanel from '../shared/GlobalBulkEditPanel';
import { AVAILABLE_TAGS } from "../../../../shared/constants/questionConstants";
import {
  TagDropdown,
  TextEditor,
  FormField,
  NumberInput,
  RadioGroup,
  Checkbox,
  Select,
  ValidationErrors
} from "../shared/SharedComponents";
import questionAPI from "../../../../api/questionAPI"; 
// import { AVAILABLE_TAGS } from '../questions/constants/questionConstants';

const CreateTrueFalseQuestion = ({ 
  onClose, 
  onSave, 
  existingQuestion = null, 
  questions, 
  isBulk 
}) => {
  const questionsToEdit = questions || (existingQuestion ? [existingQuestion] : []);

  // Single question form logic
  const {
    question,
    errors,
    updateField,
    handleTagToggle,
    validate,
    resetForm
  } = useTrueFalseForm(existingQuestion);
const [allTags, setAllTags] = useState([]);

useEffect(() => {
  questionAPI.getTags().then(setAllTags);
}, []);
  // Bulk edit logic
  const {
    bulkQuestions,
    bulkTagDropdowns,
    handleBulkChange,
    handleBulkTagToggle,
    toggleBulkTagDropdown
  } = useBulkTrueFalseEdit(questionsToEdit, isBulk);


    const [globalBulkChanges, setGlobalBulkChanges] = useState({
    status: '',
    defaultMark: '',
    penaltyFactor: '',
    generalFeedback: '',
    feedbackCorrect: '',
    feedbackIncorrect: '',
    category: '',
    tags: {
      add: [],
      remove: []
    },
    showInstructions: '',
    version: '',
    modifiedBy: ''
  });
  
  const [pendingChanges, setPendingChanges] = useState({});
  
  const handleGlobalBulkChange = (field, value) => {
    setGlobalBulkChanges(prev => ({
      ...prev,
      [field]: value
    }));
    setPendingChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleGlobalTagOperation = (operation, tag) => {
    setGlobalBulkChanges(prev => {
      const tags = { ...prev.tags };
      if (operation === 'add') {
        tags.add = [...(tags.add || []), tag];
        tags.remove = (tags.remove || []).filter(t => t !== tag);
      } else if (operation === 'remove') {
        tags.remove = [...(tags.remove || []), tag];
        tags.add = (tags.add || []).filter(t => t !== tag);
      }
      return { ...prev, tags };
    });
    setPendingChanges(prev => ({
      ...prev,
      tags: globalBulkChanges.tags
    }));
  };
  
  const applyGlobalBulkChanges = () => {
    // Implement your logic to apply global changes to all bulkQuestions
    // For now, just log or update as needed
    // Example:
    // onSave(bulkQuestions.map(q => ({ ...q, ...globalBulkChanges })));
  };
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    multipleTries: false,
    tags: false
  });
  const [allExpanded, setAllExpanded] = useState(false);
const [bulkEditMode, setBulkEditMode] = useState('global'); // global or individual
  // Reset form when question changes
  useEffect(() => {
    resetForm(existingQuestion);
  }, [existingQuestion, resetForm]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle expand all / collapse all (for bulk mode, affects all questions)
  const handleExpandAll = () => {
    const newExpandedState = !allExpanded;
    setAllExpanded(newExpandedState);
    
    if (isBulk) {
      // For bulk mode, expand/collapse all sections in all questions
      const newQuestionSections = {};
      questions.forEach((_, idx) => {
        newQuestionSections[idx] = {
          general: newExpandedState,
          multipleTries: newExpandedState,
          tags: newExpandedState
        };
      });
      // This needs to be handled in BulkEditForm component
    } else {
      // For single mode, expand/collapse current question sections
      setExpandedSections({
        general: newExpandedState,
        multipleTries: newExpandedState,
        tags: newExpandedState
      });
    }
  };

  // Save handlers
  const handleSingleSave = () => {
    if (!validate()) return;
    onSave({
      ...question,
      questionType: 'truefalse'
    });
    onClose();
  };

  const handleBulkSave = () => {
    const processedQuestions = bulkQuestions.map(q => ({
      ...q,
      questionType: 'truefalse'
    }));
    onSave(processedQuestions);
    onClose();
  };

  const correctAnswerOptions = [
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'ready', label: 'Ready' }
  ];

  const showInstructionsOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ];

  return (
   <ReactModal
     isOpen={true}
     onRequestClose={onClose}
     contentLabel="Edit Multiple Choice Question"
     style={{
       overlay: {
         zIndex: 1000,
         backgroundColor: 'rgba(0,0,0,0.6)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center'
       },
       content: {
         position: 'static',
         inset: 'unset',
         padding: 0,
         border: 'none',
         background: 'none',
         overflow: 'visible',
         maxWidth: '95vw',
         width: '100%',
         maxHeight: '95vh',
         borderRadius: '20px',
         boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
         margin: 'auto'
       }
     }}
     ariaHideApp={false}
   >
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-gray-200">
        {/* Header */}
        <Header 
          isBulk={isBulk} 
          hasExistingQuestion={!!existingQuestion}
          onClose={onClose}
          onExpandAll={handleExpandAll}
          allExpanded={allExpanded}
        />
        
           {/* Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* ADD THE MODE SWITCH HERE */}
            {isBulk && (
              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Edit Mode:</span>
                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => setBulkEditMode('global')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      bulkEditMode === 'global'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Global Changes
                  </button>
                  <button
                    onClick={() => setBulkEditMode('individual')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      bulkEditMode === 'individual'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Individual Questions
                  </button>
                </div>
              </div>
            )}
            {/* Here is  BULK/INDIVIDUAL FORM LOGIC */}
               {isBulk ? (
                <>
                  {/* Bulk edit mode switch UI goes here */}
                  {bulkEditMode === 'global' ? (
                    <GlobalBulkEditPanel
                      globalBulkChanges={globalBulkChanges}
                      pendingChanges={pendingChanges}
                      onGlobalBulkChange={handleGlobalBulkChange}
                      onGlobalTagOperation={handleGlobalTagOperation}
                      onApplyGlobalChanges={applyGlobalBulkChanges}
                      questionCount={bulkQuestions.length}
                      selectedQuestions={bulkQuestions}
                    />
                  ) : (
                    <BulkEditForm
                      questions={bulkQuestions}
                      tagDropdowns={bulkTagDropdowns}
                      onBulkChange={handleBulkChange}
                      onBulkTagToggle={handleBulkTagToggle}
                      onToggleBulkTagDropdown={toggleBulkTagDropdown}
                      correctAnswerOptions={correctAnswerOptions}
                      statusOptions={statusOptions}
                      showInstructionsOptions={showInstructionsOptions}
                      allTags={allTags}
                    />
                  )}
                </>
              ) : (
                <SingleEditForm
                  question={question}
                  errors={errors}
                  onUpdateField={updateField}
                  onTagToggle={handleTagToggle}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                  correctAnswerOptions={correctAnswerOptions}
                  statusOptions={statusOptions}
                  showInstructionsOptions={showInstructionsOptions}
                  allTags={allTags} // Use the fetched tags from API
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer 
          onClose={onClose}
          onSave={isBulk ? handleBulkSave : handleSingleSave}
          isBulk={isBulk}
        />
      </div>
    </ReactModal>
  );
};

// Header Component
const Header = ({ isBulk, hasExistingQuestion, onClose, onExpandAll, allExpanded }) => (
  <div className="p-4 border-b border-gray-200">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center">
          {isBulk
            ? 'Bulk Edit True/False Questions'
            : (hasExistingQuestion ? 'Edit True/False Question' : 'Adding a True/False question')}
          <span className="ml-2 text-blue-500 cursor-help" title="Help">ⓘ</span>
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        {/* Show Expand/Collapse for both single and bulk modes */}
        <button 
          onClick={onExpandAll}
          className="text-blue-600 hover:text-blue-800 underline text-sm transition-colors"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  </div>
);

// Footer Component
const Footer = ({ onClose, onSave, isBulk }) => (
  <div className="p-6 border-t border-gray-200 bg-gray-50">
    <div className="flex justify-between items-center">
      <div className="flex items-center text-sm text-red-600">
        <AlertCircle size={16} className="mr-1" />
        Required
      </div>
      <div className="flex space-x-3">
        {!isBulk && (
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
          >
            Save changes and continue editing
          </button>
        )}
        <button
          onClick={onSave}
          className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
        >
          Save changes
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Section Header Component
const SectionHeader = ({ title, isExpanded, onToggle, required = false }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between py-2 text-left border-b border-gray-200"
  >
    <div className="flex items-center space-x-2">
      <ChevronDown 
        size={16} 
        className={`transform transition-transform duration-200 ${
          isExpanded ? 'rotate-0' : '-rotate-90'
        }`}
      />
      <h3 className="text-lg font-medium text-gray-900">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </h3>
    </div>
  </button>
);

// Single Edit Form Component
const SingleEditForm = ({
  question,
  errors,
  onUpdateField,
  onTagToggle,
  expandedSections,
  onToggleSection,
  correctAnswerOptions,
  statusOptions,
  showInstructionsOptions,
  allTags
}) => {
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      <ValidationErrors errors={errors} />

      {/* General Section */}
      <div className="space-y-4">
        <SectionHeader
          title="General"
          isExpanded={expandedSections.general}
          onToggle={() => onToggleSection('general')}
          required={true}
        />
        
        {expandedSections.general && (
          <div className="space-y-6 pt-4">
            {/* Category */}
            <FormField label="Category">
              <Select
                value="Default for P-test (8)"
                onChange={() => {}}
                options={[{ value: "Default for P-test (8)", label: "Default for P-test (8)" }]}
                className="w-full max-w-md"
              />
            </FormField>

            {/* Question Name */}
            <FormField label="Question name" required error={errors.title}>
              <div className="relative">
                <input
                  type="text"
                  value={question.title}
                  onChange={e => onUpdateField('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder=""
                />
                {errors.title && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
              </div>
            </FormField>

            {/* Question Text */}
            <FormField label="Question text" required error={errors.questionText}>
              <div className="relative">
                <TextEditor
                  value={question.questionText}
                  onChange={value => onUpdateField('questionText', value)}
                  placeholder=""
                  error={errors.questionText}
                  minHeight="200px"
                />
                {errors.questionText && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
              </div>
            </FormField>

            {/* Question Status, Default Mark, ID Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Question status">
                <Select
                  value={question.status}
                  onChange={value => onUpdateField('status', value)}
                  options={statusOptions}
                  className="w-full"
                />
              </FormField>
              
              <FormField label="Default mark" required error={errors.defaultMark}>
                <div className="relative">
                  <input
                    type="number"
                    value={question.defaultMark}
                    onChange={e => onUpdateField('defaultMark', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.defaultMark ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.1"
                  />
                  {errors.defaultMark && <span className="absolute right-3 top-2 text-red-500 text-sm">🔺</span>}
                </div>
              </FormField>

              <FormField label="ID number">
                <div className="relative">
                  <input
                    type="text"
                    value={question.idNumber || ''}
                    onChange={e => onUpdateField('idNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder=""
                  />
                  <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
                </div>
              </FormField>
            </div>

            {/* General Feedback */}
            <FormField label="General feedback">
              <div className="relative">
                <TextEditor
                  value={question.generalFeedback}
                  onChange={value => onUpdateField('generalFeedback', value)}
                  placeholder=""
                  minHeight="120px"
                />
                <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
              </div>
            </FormField>

            {/* Correct Answer */}
            <FormField label="Correct answer">
              <Select
                value={question.correctAnswer}
                onChange={value => onUpdateField('correctAnswer', value)}
                options={correctAnswerOptions}
                className="w-48"
              />
            </FormField>

            {/* Show Instructions */}
            <FormField label="Show standard instructions">
              <div className="flex items-center space-x-2">
                <Select
                  value={question.showInstructions ? 'true' : 'false'}
                  onChange={value => onUpdateField('showInstructions', value === 'true')}
                  options={showInstructionsOptions}
                  className="w-32"
                />
                <span className="text-blue-500 text-sm cursor-help">ⓘ</span>
              </div>
            </FormField>

            {/* Feedback for Responses */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Feedback for each response</h4>
              
              <FormField label="Feedback for the response 'True'">
                <TextEditor
                  value={question.feedbackTrue}
                  onChange={value => onUpdateField('feedbackTrue', value)}
                  placeholder=""
                  minHeight="120px"
                />
              </FormField>

              <FormField label="Feedback for the response 'False'">
                <TextEditor
                  value={question.feedbackFalse}
                  onChange={value => onUpdateField('feedbackFalse', value)}
                  placeholder=""
                  minHeight="120px"
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Tries Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Multiple tries"
          isExpanded={expandedSections.multipleTries}
          onToggle={() => onToggleSection('multipleTries')}
        />
        
        {expandedSections.multipleTries && (
          <div className="pt-4">
            <FormField label="Penalty for each incorrect try">
              <div className="flex items-center space-x-2">
                <NumberInput
                  value={question.penalty}
                  onChange={value => onUpdateField('penalty', value)}
                  min={0}
                  step={0.1}
                  className="w-32"
                />
                <span className="text-blue-500 text-sm cursor-help">ⓘ</span>
              </div>
            </FormField>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="space-y-4">
        <SectionHeader
          title="Tags"
          isExpanded={expandedSections.tags}
          onToggle={() => onToggleSection('tags')}
          required={true}
        />
        
        {expandedSections.tags && (
          <div className="pt-4">
            <FormField label="Tags" required error={errors.tags}>
                           <TagDropdown
                tags={question.tags}
                onTagToggle={onTagToggle}
                isOpen={tagDropdownOpen}
                onToggle={() => setTagDropdownOpen(!tagDropdownOpen)}
                error={errors.tags}
                availableTags={allTags} // <-- use allTags from API
              />
              <p className="text-sm text-gray-500 mt-2">
                Select tags to categorize and filter this question. You can search for existing tags or create new ones.
              </p>
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
};

// Bulk Edit Form Component
const BulkEditForm = ({
  questions,
  tagDropdowns,
  onBulkChange,
  onBulkTagToggle,
  onToggleBulkTagDropdown,
  correctAnswerOptions,
  statusOptions,
  showInstructionsOptions
}) => {
  // Individual section states for each question
  const [questionSections, setQuestionSections] = useState(
    questions.reduce((acc, _, idx) => ({
      ...acc,
      [idx]: {
        general: true,
        multipleTries: false,
        tags: false
      }
    }), {})
  );

  const toggleQuestionSection = (questionIdx, section) => {
    setQuestionSections(prev => ({
      ...prev,
      [questionIdx]: {
        ...prev[questionIdx],
        [section]: !prev[questionIdx][section]
      }
    }));
  };

  // Add expand/collapse all for individual questions
  const handleExpandAllForQuestion = (questionIdx) => {
    const currentSections = questionSections[questionIdx];
    const allExpanded = Object.values(currentSections).every(val => val);
    const newState = !allExpanded;
    
    setQuestionSections(prev => ({
      ...prev,
      [questionIdx]: {
        general: newState,
        multipleTries: newState,
        tags: newState
      }
    }));
  };

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => (
        <div key={q.id || idx} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Question #{idx + 1}</h3>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-16"></div>
            </div>
            {/* Individual Expand/Collapse for each question */}
            <button 
              onClick={() => handleExpandAllForQuestion(idx)}
              className="text-blue-600 hover:text-blue-800 underline text-sm transition-colors"
            >
              {Object.values(questionSections[idx] || {}).every(val => val) ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          
          <div className="space-y-6">
            {/* General Section */}
            <div className="space-y-4">
              <SectionHeader
                title="General"
                isExpanded={questionSections[idx]?.general ?? true}
                onToggle={() => toggleQuestionSection(idx, 'general')}
                required={true}
              />
              
              {(questionSections[idx]?.general ?? true) && (
                <div className="space-y-6 pt-4">
                  {/* Category */}
                  <FormField label="Category">
                    <Select
                      value="Default for P-test (8)"
                      onChange={() => {}}
                      options={[{ value: "Default for P-test (8)", label: "Default for P-test (8)" }]}
                      className="w-full max-w-md"
                    />
                  </FormField>

                  {/* Question Name */}
                  <FormField label="Question name" required>
                    <input
                      type="text"
                      value={q.title}
                      onChange={e => onBulkChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=""
                    />
                  </FormField>

                  {/* Question Text */}
                  <FormField label="Question text" required>
                    <TextEditor
                      value={q.questionText}
                      onChange={value => onBulkChange(idx, 'questionText', value)}
                      placeholder=""
                      minHeight="200px"
                    />
                  </FormField>

                  {/* Question Status, Default Mark, ID Number */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField label="Question status">
                      <Select
                        value={q.status || 'ready'}
                        onChange={value => onBulkChange(idx, 'status', value)}
                        options={statusOptions}
                        className="w-full"
                      />
                    </FormField>
                    
                    <FormField label="Default mark" required>
                      <input
                        type="number"
                        value={q.defaultMark}
                        onChange={e => onBulkChange(idx, 'defaultMark', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.1"
                      />
                    </FormField>

                    <FormField label="ID number">
                      <div className="relative">
                        <input
                          type="text"
                          value={q.idNumber || ''}
                          onChange={e => onBulkChange(idx, 'idNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder=""
                        />
                        <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
                      </div>
                    </FormField>
                  </div>

                  {/* General Feedback */}
                  <FormField label="General feedback">
                    <div className="relative">
                      <TextEditor
                        value={q.generalFeedback || ''}
                        onChange={value => onBulkChange(idx, 'generalFeedback', value)}
                        placeholder=""
                        minHeight="120px"
                      />
                      <span className="absolute right-3 top-2 text-blue-500 text-sm cursor-help">ⓘ</span>
                    </div>
                  </FormField>

                  {/* Correct Answer and Show Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Correct answer">
                      <Select
                        value={q.correctAnswer}
                        onChange={value => onBulkChange(idx, 'correctAnswer', value)}
                        options={correctAnswerOptions}
                        className="w-full"
                      />
                    </FormField>

                    <FormField label="Show standard instructions">
                      <div className="flex items-center space-x-2">
                        <Select
                          value={q.showInstructions ? 'true' : 'false'}
                          onChange={value => onBulkChange(idx, 'showInstructions', value === 'true')}
                          options={showInstructionsOptions}
                          className="w-32"
                        />
                        <span className="text-blue-500 text-sm cursor-help">ⓘ</span>
                      </div>
                    </FormField>
                  </div>

                  {/* Feedback for Responses */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Feedback for each response</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField label='For "True" response'>
                        <TextEditor
                          value={q.feedbackTrue || ''}
                          onChange={value => onBulkChange(idx, 'feedbackTrue', value)}
                          placeholder=""
                          minHeight="100px"
                        />
                      </FormField>

                      <FormField label='For "False" response'>
                        <TextEditor
                          value={q.feedbackFalse || ''}
                          onChange={value => onBulkChange(idx, 'feedbackFalse', value)}
                          placeholder=""
                          minHeight="100px"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Multiple Tries Section */}
            <div className="space-y-4">
              <SectionHeader
                title="Multiple tries"
                isExpanded={questionSections[idx]?.multipleTries ?? false}
                onToggle={() => toggleQuestionSection(idx, 'multipleTries')}
              />
              
              {(questionSections[idx]?.multipleTries ?? false) && (
                <div className="pt-4">
                  <FormField label="Penalty for each incorrect try">
                    <div className="flex items-center space-x-2">
                      <NumberInput
                        value={q.penalty}
                        onChange={value => onBulkChange(idx, 'penalty', value)}
                        min={0}
                        step={0.1}
                        className="w-32"
                      />
                      <span className="text-blue-500 text-sm cursor-help">ⓘ</span>
                    </div>
                  </FormField>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <SectionHeader
                title="Tags"
                isExpanded={questionSections[idx]?.tags ?? false}
                onToggle={() => toggleQuestionSection(idx, 'tags')}
                required={true}
              />
              
              {(questionSections[idx]?.tags ?? false) && (
                <div className="pt-4">
                  <FormField label="Tags" required>
                     <TagDropdown
                      tags={q.tags}
                      onTagToggle={(tag) => onBulkTagToggle(idx, tag)}
                      isOpen={!!tagDropdowns[idx]}
                      onToggle={() => onToggleBulkTagDropdown(idx)}
                      availableTags={allTags} // <-- use allTags from API
                    />
                  </FormField>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreateTrueFalseQuestion;