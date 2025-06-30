import React, { useState, useEffect } from 'react';
import { useBulkEditAPI } from '../../hooks/useBulkEditAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faTimes, faInfoCircle, faLayerGroup, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { TagManager, BulkActionsPanel, ChangesPreview } from "../shared/BulkEditComponents";

const statusOptions = [
  {
    value: 'draft',
    label: 'Draft',
    color: 'text-yellow-800',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
  },
  {
    value: 'ready',
    label: 'Ready',
    color: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
  }
];

const BulkEditModal = ({ 
  questions, 
  onClose, 
  onSave,
  username = "Unknown User"
}) => {
  const [editMode, setEditMode] = useState('basic'); // 'basic' or 'advanced'
  const [bulkChanges, setBulkChanges] = useState({
    status: '',
    tags: {
      add: [],
      remove: []
    }
  });

  const [individualChanges, setIndividualChanges] = useState({});

  // API hooks
  const {
    tags,
    tagsLoading,
    tagsError,
    addCustomTag,
    refreshTags,
    existingTags,
    bulkLoading,
    isLoading,
  } = useBulkEditAPI(questions);

  // Initialize individual changes with current question data
  useEffect(() => {
    const initial = {};
    questions.forEach(q => {
      initial[q.id] = {
        status: q.status || 'draft',
        tags: q.tags || []
      };
    });
    setIndividualChanges(initial);
  }, [questions]);

  const handleBulkChange = (field, value) => {
    setBulkChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagOperation = (operation, tag) => {
    setBulkChanges(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [operation]: prev.tags[operation].includes(tag)
          ? prev.tags[operation].filter(t => t !== tag)
          : [...prev.tags[operation], tag]
      }
    }));
  };

  const handleIndividualChange = (questionId, field, value) => {
    setIndividualChanges(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const applyBulkChanges = () => {
    const updatedChanges = { ...individualChanges };
    questions.forEach(q => {
      // Apply status change if specified
      if (bulkChanges.status) {
        updatedChanges[q.id].status = bulkChanges.status;
      }
      
      // Handle tags
      let newTags = [...updatedChanges[q.id].tags];
      bulkChanges.tags.add.forEach(tag => {
        if (!newTags.includes(tag)) {
          newTags.push(tag);
        }
      });
      bulkChanges.tags.remove.forEach(tag => {
        newTags = newTags.filter(t => t !== tag);
      });
      updatedChanges[q.id].tags = newTags;
    });
    setIndividualChanges(updatedChanges);
  };

  const handleSave = async () => {
    try {
      const updatedQuestions = questions.map(q => ({
        ...q,
        ...individualChanges[q.id],
        version: `v${parseInt(q.version.substring(1)) + 1}`,
        modifiedBy: {
          name: username,
          role: "",
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
      }));
      onSave(updatedQuestions);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50">
      {/* Overlay */}
      <div className="absolute inset-0" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 border border-blue-500 rounded">
              <span className="text-blue-600 text-2xl">
                <FontAwesomeIcon icon={faLayerGroup} />
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Edit Questions</h2>
              <p className="text-xs text-gray-500">{`Editing ${questions.length} questions`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-blue-600 transition-colors text-2xl font-bold focus:outline-none">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setEditMode('basic')}
              className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-colors ${
                editMode === 'basic' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Basic Edit
            </button>
            <button
              onClick={() => setEditMode('advanced')}
              className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-colors ${
                editMode === 'advanced' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual Edit
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-white rounded-b-xl">
          {editMode === 'basic' ? (
            <div className="space-y-8">
              <BulkActionsPanel
                title="Apply to Selected Questions"
                description={`Make changes to all ${questions.length} selected questions at once`}
                onApply={applyBulkChanges}
                applyButtonText="Apply Changes to All Questions"
                loading={bulkLoading}
              >
                {/* Status Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        bulkChanges.status === '' 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleBulkChange('status', '')}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={bulkChanges.status === ''}
                          onChange={() => handleBulkChange('status', '')}
                          className="mr-3"
                        />
                        <span className="text-gray-700 font-medium">No change</span>
                      </div>
                    </div>
                    {statusOptions.map((status) => (
                      <div
                        key={status.value}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          bulkChanges.status === status.value 
                            ? `${status.border} ${status.bg}` 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handleBulkChange('status', status.value)}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            checked={bulkChanges.status === status.value}
                            onChange={() => handleBulkChange('status', status.value)}
                            className="mr-3"
                          />
                          <span className="mr-2">{status.icon}</span>
                          <span className={`font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tag Management */}
                <TagManager
                  availableTags={tags}
                  existingTags={existingTags}
                  selectedAddTags={bulkChanges.tags.add}
                  selectedRemoveTags={bulkChanges.tags.remove}
                  onTagOperation={handleTagOperation}
                  onAddCustomTag={addCustomTag}
                  loading={tagsLoading}
                  error={tagsError}
                  onRefresh={refreshTags}
                  showSmartRemoval={true}
                  customTagPlaceholder="Enter new tag name"
                />
              </BulkActionsPanel>

              <ChangesPreview
                questions={questions}
                individualChanges={individualChanges}
                title="Preview Changes"
                maxHeight="16rem"
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center mb-2">
                <span className="text-blue-600 mr-3 text-2xl">
                  <FontAwesomeIcon icon={faInfoCircle} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-blue-900">Individual Edit Mode</h3>
                  <p className="text-sm text-blue-700">Edit each question individually. Changes will only apply to the specific question you modify.</p>
                </div>
              </div>
              <div className="space-y-6 max-h-[28rem] overflow-y-auto pr-1">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Question {index + 1}
                      </h3>
                      <span className="text-xs text-gray-400 font-mono">ID: {q.id}</span>
                    </div>

                    {/* Status Selection for Individual Question */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {statusOptions.map((status) => (
                          <div
                            key={status.value}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              individualChanges[q.id]?.status === status.value 
                                ? `${status.border} ${status.bg}` 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => handleIndividualChange(q.id, 'status', status.value)}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name={`status-${q.id}`}
                                checked={individualChanges[q.id]?.status === status.value}
                                onChange={() => handleIndividualChange(q.id, 'status', status.value)}
                                className="mr-3"
                              />
                              <span className="mr-2">{status.icon}</span>
                              <span className={`font-medium ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags for Individual Question */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <TagManager
                        availableTags={tags}
                        existingTags={existingTags}
                        selectedAddTags={individualChanges[q.id]?.tags || []}
                        selectedRemoveTags={individualChanges[q.id]?.tags || []}
                        onTagOperation={(operation, tag) => {
                          handleIndividualChange(
                            q.id,
                            'tags',
                            operation === 'add'
                              ? [
                                  ...(individualChanges[q.id]?.tags || []).filter(t => t !== tag),
                                  tag
                                ]
                              : (individualChanges[q.id]?.tags || []).filter(t => t !== tag)
                          );
                        }}
                        onAddCustomTag={addCustomTag}
                        loading={tagsLoading}
                        error={tagsError}
                        onRefresh={refreshTags}
                        showSmartRemoval={true}
                        customTagPlaceholder="Enter new tag name"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="text-sm text-gray-600 flex flex-wrap items-center gap-4">
            {tags.length > 0 && (
              <span className="text-blue-700 flex items-center">
                <FontAwesomeIcon icon={faTags} className="mr-1" />
                {tags.length} tags loaded
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-semibold transition-colors shadow ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;