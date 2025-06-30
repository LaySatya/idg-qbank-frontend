// ============================================================================
// components/questions/components/QuestionSettings.jsx
// ============================================================================

import React from 'react';
import { FormField, NumberInput } from './SharedComponents';

const QuestionSettings = ({ defaultMark, penaltyFactor, onUpdateField }) => (
  <div className="grid grid-cols-2 gap-4">
    <FormField label="Default mark">
      <NumberInput
        value={defaultMark}
        onChange={value => onUpdateField('defaultMark', value)}
        min={0}
        step={1}
        className="w-full"
      />
    </FormField>
    <FormField label="Penalty factor">
      <NumberInput
        value={penaltyFactor}
        onChange={value => onUpdateField('penaltyFactor', value)}
        min={0}
        max={1}
        step={0.1}
        className="w-full"
      />
    </FormField>
  </div>
);

export default QuestionSettings;