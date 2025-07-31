// ============================================================================
// src/components/CreateQuestionModal.jsx - Enhanced Question Creation Modal
// ============================================================================
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointer } from '@fortawesome/free-solid-svg-icons';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const CreateQuestionModal = ({ 
  onClose, 
  onSelectType, 
  questions,
  availableQuestionTypes = [],
  loadingQuestionTypes = false
}) => {
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Always use API question types if available
  const questionTypes = availableQuestionTypes.length > 0
    ? availableQuestionTypes.map(type => ({
        value: type.name || type.value,
        label: type.label || type.name,
        icon: type.iconurl || type.icon,
        description: type.description || '',
        originalValue: type.pluginname || type.name,
      }))
    : [];

  // If no API types, fallback to empty (or optionally static minimal types)
  // This ensures icons are always loaded from API for hosted environments

  // Filter question types based on search
  const filteredQuestionTypes = questionTypes.filter(type => 
    type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Find selected type object
  const selectedTypeObj = questionTypes.find(q => q.value === selectedType);

  // Render question type icon with fallback
  const renderIcon = (type) => {
    if (type.icon) {
      return (
        <img 
          src={type.icon} 
          className="w-6 h-6" 
          alt={`${type.label} icon`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline-block';
          }}
        />
      );
    }
    return <span className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">?</span>;
  };

  // Log available question types for debugging
  useEffect(() => {
    console.log('CreateQuestionModal received question types:', {
      availableCount: availableQuestionTypes.length,
      loadingState: loadingQuestionTypes,
      filteredCount: filteredQuestionTypes.length,
      selectedType: selectedType
    });
  }, [availableQuestionTypes, loadingQuestionTypes, filteredQuestionTypes, selectedType]);

  // Auto-select first type if only one is available (for testing)
  useEffect(() => {
    if (filteredQuestionTypes.length === 1 && !selectedType) {
      setSelectedType(filteredQuestionTypes[0].value);
    }
  }, [filteredQuestionTypes, selectedType]);

  return (
    <Modal open={true} onClose={onClose} aria-labelledby="create-question-modal-title" aria-describedby="create-question-modal-description" sx={{ zIndex: 1300 }}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: 'none',
        outline: 'none',
        p: { xs: 2, sm: 4, md: 6 },
        width: { xs: '95vw', sm: 500, md: 900 },
        maxWidth: 1000,
        minWidth: 320,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'row',
        height: { xs: '90vh', sm: '80vh', md: '80vh' },
      }}>
        {/* Left Panel - Question Types */}
        <div className="w-1/3 bg-gradient-to-b from-gray-50 to-white flex flex-col" style={{ minWidth: 260, maxWidth: 340 }}>
          {/* Header */}
          <div className="px-6 pt-6 pb-3 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-800">Questions</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-blue-600 transition-colors">
              <X size={28} />
            </button>
          </div>
          {/* Divider */}
          <div className="w-full h-px bg-gray-200 mb-2"></div>

          {/* Search Input */}
          <div className="px-6 pb-4">
            <input 
              type="text" 
              placeholder="Search question types..." 
              className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-base border-2 border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow placeholder-gray-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Divider */}
          <div className="w-full h-px bg-gray-100 mb-2"></div>

          {/* Loading State */}
          {loadingQuestionTypes && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading question types from API...</p>
            </div>
          )}

          {/* Question Types List - modern seamless look */}
          {!loadingQuestionTypes && (
            <div className="flex-grow overflow-y-auto" style={{
              background: 'transparent',
              margin: '0 0 8px 0',
              padding: '0 12px',
            }}>
              <div className="space-y-3">
                {filteredQuestionTypes.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-base">
                      {searchQuery ? 'No question types match your search.' : 'No question types available.'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-600 underline text-xs"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredQuestionTypes.map((type, index) => (
                    <label 
                      key={`${type.value}-${index}`}
                      className={`w-full flex items-center px-5 py-4 bg-white hover:bg-blue-50 rounded-xl cursor-pointer transition-colors duration-150 shadow-sm ${
                        selectedType === type.value ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="questionType" 
                        className="mr-3"
                        checked={selectedType === type.value}
                        onChange={() => setSelectedType(type.value)}
                      />
                      <div className="mr-3 flex-shrink-0">
                        {renderIcon(type)}
                        {/* Fallback text icon */}
                        <span 
                          className="w-6 h-6 bg-gray-200 rounded flex-1 items-center justify-center text-xs hidden"
                        >
                          {type.label.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base">{type.label}</div>
                        {type.originalValue && type.originalValue !== type.value && (
                          <div className="text-xs text-gray-500">
                            API: {type.originalValue}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Other Section */}
          {/* <div className="p-3 border-t bg-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">OTHER</h3>
            <div className="flex items-center gap-2 py-1 px-2 hover:bg-gray-200 rounded cursor-pointer text-sm">
              <img src="/src/assets/icon/Description.svg" className="w-5 h-5" alt="Description icon" />
              <span>Description</span>
            </div>
          </div> */}
        </div>

        {/* Right Panel - Description */}
        <div className="w-2/3 p-6 flex flex-col" style={{ minWidth: 350 }}>
          {selectedTypeObj ? (
            <div className="flex-grow flex flex-col">
              {/* Question Type Icon (Large) */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  {selectedTypeObj.icon ? (
                    <img 
                      src={selectedTypeObj.icon} 
                      className="w-full h-full object-contain" 
                      alt={`${selectedTypeObj.label} icon`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback large icon */}
                  <div 
                    className="w-full h-full bg-gray-200 rounded-lg f items-center justify-center text-3xl font-bold text-gray-500 hidden"
                  >
                    {selectedTypeObj.label.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedTypeObj.label}
                </h3>
                
                {/* Show API mapping info in development */}
                {process.env.NODE_ENV === 'development' && selectedTypeObj.originalValue && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                    API Type: {selectedTypeObj.originalValue} → {selectedTypeObj.value}
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="flex-grow">
                {/* <p className="text-gray-600 text-center leading-relaxed mb-6">
                  {selectedTypeObj.description || 'No description available for this question type.'}
                </p>
                 */}
                {/* Additional Info */}
                {/* {availableQuestionTypes.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2"> Loaded from API</h4>
                    <p className="text-sm text-blue-700">
                      This question type was loaded from your Laravel API. 
                      {selectedTypeObj.originalValue && selectedTypeObj.originalValue !== selectedTypeObj.value && (
                        <span> Original API type: <code className="bg-blue-100 px-1 rounded">{selectedTypeObj.originalValue}</code></span>
                      )}
                    </p>
                  </div>
                )} */}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (selectedTypeObj) {
                      onSelectType(selectedTypeObj);
                    }
                  }}
                  disabled={!selectedTypeObj}
                >
                  Add Question
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              {loadingQuestionTypes ? (
                <div className="text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Loading Question Types</p>
                  <p className="text-sm">Fetching available types from your API...</p>
                </div>
              ) : filteredQuestionTypes.length === 0 ? (
                <div className="text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl"></span>
                  </div>
                  <p className="text-lg font-medium mb-2">No Question Types Available</p>
                  <p className="text-sm max-w-md">
                    {searchQuery ? (
                      <>
                        No question types match "{searchQuery}". 
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-blue-600 underline ml-1"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      'Unable to load question types from the API. Please check your connection and try again.'
                    )}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">
                      <FontAwesomeIcon icon={faHandPointer} />
                    </span>
                  </div>
                  <p className="text-lg font-medium mb-2">Select a Question Type</p>
                  <p className="text-sm">Choose a question type from the list to see its description and create a new question.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Box>
    </Modal>
  );
};

export default CreateQuestionModal;