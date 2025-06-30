// ============================================================================
// components/questions/components/GradingInfo.jsx
// ============================================================================

import React from 'react';

const GradingInfo = ({ choices = [] }) => {
  const totalGrade = choices.reduce((sum, choice) => {
    const grade = parseFloat(choice.grade?.replace('%', '')) || 0;
    return sum + grade;
  }, 0);

  const correctChoices = choices.filter(choice => {
    const grade = parseFloat(choice.grade?.replace('%', '')) || 0;
    return grade > 0;
  });

  const hasCorrectAnswer = correctChoices.length > 0;
  const isValidGrading = totalGrade === 100;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
        <span className="mr-2"></span>
        Grading Information
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-white rounded-lg p-3">
          <div className="text-gray-600 text-xs">Total Grade</div>
          <div className={`text-lg font-bold ${isValidGrading ? 'text-green-600' : 'text-orange-600'}`}>
            {totalGrade.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3">
          <div className="text-gray-600 text-xs">Correct Choices</div>
          <div className={`text-lg font-bold ${hasCorrectAnswer ? 'text-green-600' : 'text-red-600'}`}>
            {correctChoices.length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3">
          <div className="text-gray-600 text-xs">Total Choices</div>
          <div className="text-lg font-bold text-blue-600">
            {choices.length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3">
          <div className="text-gray-600 text-xs">Status</div>
          <div className={`text-sm font-medium ${
            hasCorrectAnswer && isValidGrading 
              ? 'text-green-600' 
              : 'text-orange-600'
          }`}>
            {hasCorrectAnswer && isValidGrading ? 'Valid' : '⚠ Needs Review'}
          </div>
        </div>
      </div>
      
      {/* Validation Messages */}
      <div className="mt-3 space-y-1">
        {!hasCorrectAnswer && (
          <div className="text-xs text-red-600 flex items-center">
            <span className="mr-1"></span>
            No correct answers defined. At least one choice must have a positive grade.
          </div>
        )}
        
        {totalGrade !== 100 && (
          <div className="text-xs text-orange-600 flex items-center">
            <span className="mr-1">⚠</span>
            Total grade is {totalGrade}%. Consider adjusting grades to total 100%.
          </div>
        )}
        
        {hasCorrectAnswer && isValidGrading && (
          <div className="text-xs text-green-600 flex items-center">
            <span className="mr-1"></span>
            Question grading is properly configured.
          </div>
        )}
      </div>
    </div>
  );
};
export default GradingInfo;
