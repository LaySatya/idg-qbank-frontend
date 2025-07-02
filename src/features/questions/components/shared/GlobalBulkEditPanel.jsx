// components/questions/components/GlobalBulkEditPanel.jsx - Fixed to show only existing tags
import React, { useState } from 'react';
import { ChevronDown, AlertCircle, Users, Edit3, Globe, Zap, Check, X } from 'lucide-react';
import { TextEditor } from './SharedComponents'; // Your existing SharedComponents
import { useBulkEditAPI } from "../../hooks/useBulkEditAPI";
import { TagManager, CategorySelector, BulkActionsPanel } from '../shared/BulkEditComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faFolder, faChartBar, faSpinner } from '@fortawesome/free-solid-svg-icons';
const GlobalBulkEditPanel = ({ 
  globalBulkChanges, 
  pendingChanges, 
  onGlobalBulkChange, 
  onGlobalTagOperation, 
  onApplyGlobalChanges,
  questionCount = selectedQuestions?.length,
  selectedQuestions = [],

}) => {
  const [expandedSections, setExpandedSections] = useState({
    basicSettings: true,
    tagsManagement: false,
    feedback: false,
    metadata: false
  });

  //  PASS ALL QUESTIONS to analyze existing tags
const {
  tags,
  tagsLoading,
  tagsError,
  addCustomTag,
  refreshTags,
  categories,
  categoriesLoading,
  categoriesError,
  refreshCategories,
  existingTags, // <-- tags from selectedQuestions
  hasExistingTags,
  bulkLoading,
  bulkError,
  isLoading,
  refreshAll,
} = useBulkEditAPI(selectedQuestions);
  // } = useBulkEditAPI(allQuestions); // Pass all questions for analysis

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, isExpanded, onToggle, icon: Icon, count }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 px-6 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {count && (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      <ChevronDown 
        size={18} 
        className={`transform transition-transform duration-200 text-gray-500 ${
          isExpanded ? 'rotate-0' : '-rotate-90'
        }`}
      />
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
              <Zap size={24} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">The same type Bulk Edit</h2>
              <p className="text-gray-600 mt-1">Apply changes to all {questionCount} questions at once</p>
            </div>
          </div>
          
          {/* API Status Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {isLoading && (
              <span className="text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading API data...
              </span>
            )}
            {(tagsError || categoriesError) && (
              <span className="text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                API Error
              </span>
            )}
            {!isLoading && !tagsError && !categoriesError && (
              <span className="text-green-600 flex items-center">
                <Check size={16} className="mr-1" />
                API Connected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Settings Section */}
        <div className="border border-gray-200 rounded-lg">
          <SectionHeader
            title="Basic Settings"
            isExpanded={expandedSections.basicSettings}
            onToggle={() => toggleSection('basicSettings')}
            icon={Edit3}
            count="Core Fields"
          />
          
          {expandedSections.basicSettings && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Question Status
                  </label>
                  <select
                    value={globalBulkChanges?.status || ''}
                    onChange={(e) => onGlobalBulkChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  >
                    <option value="">No change</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Default Mark
                  </label>
                  <input
                    type="number"
                    value={globalBulkChanges?.defaultMark || ''}
                    onChange={(e) => onGlobalBulkChange('defaultMark', e.target.value)}
                    placeholder="No change"
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <CategorySelector
                    categories={categories}
                    selectedCategory={globalBulkChanges?.category || ''}
                    onChange={(value) => onGlobalBulkChange('category', value)}
                    loading={categoriesLoading}
                    error={categoriesError}
                    onRefresh={refreshCategories}
                    placeholder="No change"
                    label="Category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Penalty Factor (0-1)
                  </label>
                  <input
                    type="number"
                    value={globalBulkChanges?.penaltyFactor || ''}
                    onChange={(e) => onGlobalBulkChange('penaltyFactor', e.target.value)}
                    placeholder="No change"
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Show Instructions
                  </label>
                  <select
                    value={globalBulkChanges?.showInstructions === null ? '' : globalBulkChanges?.showInstructions?.toString() || ''}
                    onChange={(e) => onGlobalBulkChange('showInstructions', e.target.value === '' ? null : e.target.value === 'true')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  >
                    <option value="">No change</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags Management Section */}
        <div className="border border-gray-200 rounded-lg">
          <SectionHeader
            title="Tags Management"
            isExpanded={expandedSections.tagsManagement}
            onToggle={() => toggleSection('tagsManagement')}
            icon={Users}
            count={`+${globalBulkChanges?.tags?.add?.length || 0} -${globalBulkChanges?.tags?.remove?.length || 0}`}
          />
          
          {expandedSections.tagsManagement && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6">
                <TagManager
                  availableTags={tags}
                  existingTags={existingTags} //  Now contains tags from all questions
                  selectedAddTags={globalBulkChanges?.tags?.add || []}
                  selectedRemoveTags={globalBulkChanges?.tags?.remove || []}
                  onTagOperation={onGlobalTagOperation}
                  onAddCustomTag={addCustomTag}
                  loading={tagsLoading}
                  error={tagsError}
                  onRefresh={refreshTags}
                  showSmartRemoval={true} //  CHANGED: Now use smart removal for global too
                  customTagPlaceholder="Enter new tag for global use"
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        <div className="border border-gray-200 rounded-lg">
          <SectionHeader
            title="Feedback Messages"
            isExpanded={expandedSections.feedback}
            onToggle={() => toggleSection('feedback')}
            icon={AlertCircle}
            count="Standardize"
          />
          
          {expandedSections.feedback && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    General Feedback
                  </label>
                  <TextEditor
                    value={globalBulkChanges?.generalFeedback || ''}
                    onChange={(value) => onGlobalBulkChange('generalFeedback', value)}
                    placeholder="Leave empty for no change"
                    minHeight="100px"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Feedback for Correct Answers
                  </label>
                  <TextEditor
                    value={globalBulkChanges?.feedbackCorrect || ''}
                    onChange={(value) => onGlobalBulkChange('feedbackCorrect', value)}
                    placeholder="Leave empty for no change"
                    minHeight="100px"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Feedback for Incorrect Answers
                  </label>
                  <TextEditor
                    value={globalBulkChanges?.feedbackIncorrect || ''}
                    onChange={(value) => onGlobalBulkChange('feedbackIncorrect', value)}
                    placeholder="Leave empty for no change"
                    minHeight="100px"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div className="border border-gray-200 rounded-lg">
          <SectionHeader
            title="Metadata"
            isExpanded={expandedSections.metadata}
            onToggle={() => toggleSection('metadata')}
            icon={Globe}
            count="System Fields"
          />
          
          {expandedSections.metadata && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Version
                  </label>
                  <input
                    type="text"
                    value={globalBulkChanges?.version || ''}
                    onChange={(e) => onGlobalBulkChange('version', e.target.value)}
                    placeholder="e.g., v2.0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Modified By
                  </label>
                  <input
                    type="email"
                    value={globalBulkChanges?.modifiedBy || ''}
                    onChange={(e) => onGlobalBulkChange('modifiedBy', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Changes Preview and Actions */}
        <div className="border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Changes Summary</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                     {tags.length > 0 && (
                  <span>
                    <FontAwesomeIcon icon={faTags} className="mr-1" />
                    {tags.length} tags available
                  </span>
                )}
                {hasExistingTags && (
                  <span>
                    <FontAwesomeIcon icon={faChartBar} className="mr-1" />
                    {existingTags.length} tags in use
                  </span>
                )}
                {categories.length > 0 && (
                  <span>
                    <FontAwesomeIcon icon={faFolder} className="mr-1" />
                    {categories.length} categories available
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(pendingChanges || {}).length > 0 ? (
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  The following changes will be applied to ALL questions:
                </p>
                {Object.values(pendingChanges).map((change, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-sm text-gray-500 mb-2">No changes selected</p>
                <p className="text-xs text-gray-400">
                  Configure the settings above to see a preview of changes
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {Object.keys(pendingChanges || {}).length > 0 && (
                  <span>
                    Ready to apply <span className="font-semibold">{Object.keys(pendingChanges).length}</span> change{Object.keys(pendingChanges).length !== 1 ? 's' : ''} to <span className="font-semibold">{questionCount}</span> question{questionCount !== 1 ? 's' : ''}
                  </span>
                )}
                {bulkError && (
                  <span className="text-red-600 flex items-center mt-2">
                    <AlertCircle size={16} className="mr-1" />
                    {bulkError}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                 <button
                  onClick={refreshAll}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 flex items-center"
                >
                  <span className="w-4 h-4 mr-2 flex items-center justify-center">
                    {isLoading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faSpinner} />
                    )}
                  </span>
                  Refresh API Data
                </button>
                <button
                  onClick={onApplyGlobalChanges}
                  disabled={Object.keys(pendingChanges || {}).length === 0 || bulkLoading || isLoading}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                    Object.keys(pendingChanges || {}).length > 0 && !bulkLoading && !isLoading
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {bulkLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying Changes...
                    </span>
                  ) : (
                    'Apply Global Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalBulkEditPanel;