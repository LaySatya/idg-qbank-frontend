// ============================================================================
// components/questions/components/ChoiceEditor.jsx
// ============================================================================

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TextEditor, FormField, Select } from './SharedComponents';

const ChoiceEditor = ({ 
  choices, 
  onUpdateChoice, 
  onAddChoice, 
  onRemoveChoice, 
  errors = [], 
  isBulk = false,
  gradeOptions = []
}) => {
  console.log("ChoiceEditor received choices:", choices);

  return (
    <div>
      <div className="space-y-4">
        {choices.map((choice, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choice {index + 1}
              </label>
                            <TextEditor
                value={choice.text !== undefined ? choice.text : choice.answer || ''}
                onChange={value => {
                  onUpdateChoice(index, 'text', value);
                  onUpdateChoice(index, 'answer', value); 
                }}
                placeholder=""
                error={errors && errors[index]}
                minHeight="80px"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Grade">
                <Select
                  value={choice.grade}
                  onChange={value => onUpdateChoice(index, 'grade', value)}
                  options={gradeOptions}
                  className="w-full"
                />
              </FormField>
              <FormField label="Feedback">
                <TextEditor
                  value={choice.feedback}
                  onChange={value => onUpdateChoice(index, 'feedback', value)}
                  placeholder=""
                  minHeight="80px"
                />
              </FormField>
            </div>
          </div>
        ))}
        <button
          onClick={onAddChoice}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Blanks for 3 more choices
        </button>
      </div>
    </div>
  );
};



export default ChoiceEditor;