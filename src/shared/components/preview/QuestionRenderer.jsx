// ============================================================================
// QuestionRenderer.jsx - Renders different question types
// ============================================================================
import React from 'react';

import { processHTMLContent } from '../../utils/htmlProcessor';
// Question type definitions
const questionTypes = {
  'calculated': 'Calculated',
  'calculatedmulti': 'Calculated multichoice',
  'calculatedsimple': 'Calculated simple',
  'ddimageortext': 'Drag and drop onto image',
  'ddmarker': 'Drag and drop markers',
  'ddwtos': 'Drag and drop into text',
  'description': 'Description',
  'essay': 'Essay',
  'gapselect': 'Select missing words',
  'match': 'Matching',
  'missingtype': 'Missing question type placeholder',
  'multianswer': 'Embedded answers (Cloze)',
  'multichoice': 'Multiple choice',
  'numerical': 'Numerical',
  'ordering': 'Ordering',
  'random': 'Random',
  'randomsamatch': 'Random short-answer matching',
  'shortanswer': 'Short answer',
  'truefalse': 'True/False'
};

export const QuestionRenderer = ({
  previewData,
  selectedAnswer,
  questionState,
  onAnswerChange,
  onStartAgain,
  onSave,
  onFillCorrectResponses,
  onSubmitAndFinish,
  onRequestClose
}) => {
  // Helper functions
  const getStatusBadgeStyle = (status) => {
    if (status === 'ready') {
      return {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      };
    }
    return {
      backgroundColor: '#fff3cd',
      color: '#856404',
      border: '1px solid #ffeaa7'
    };
  };

  const getAnswerStyle = (answer, isSelected) => {
    let style = {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      marginBottom: '8px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #dee2e6',
      backgroundColor: '#ffffff'
    };

    if (isSelected) {
      style.backgroundColor = '#e3f2fd';
      style.border = '1px solid #2196f3';
    }

    if (questionState === 'correct' || questionState === 'incorrect') {
      if (answer.isCorrect) {
        style.backgroundColor = '#d4edda';
        style.border = '1px solid #c3e6cb';
        style.color = '#155724';
      } else if (isSelected && !answer.isCorrect) {
        style.backgroundColor = '#f8d7da';
        style.border = '1px solid #f5c6cb';
        style.color = '#721c24';
      }
    }

    return style;
  };

  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  };

  // Render True/False Question
  const renderTrueFalseQuestion = () => (
    <div className="answer-options">
      <div style={{ marginBottom: '12px', fontWeight: '500' }}>Select one:</div>
      {previewData.answers.map((answer) => {
        const cleanAnswer = answer.text.replace(/<[^>]*>/g, '');
        const isSelected = selectedAnswer === answer.id.toString();
        
        return (
          <div
            key={answer.id}
            style={getAnswerStyle(answer, isSelected)}
            onClick={() => onAnswerChange(answer.id.toString())}
          >
            <input
              type="radio"
              name={`question_${previewData.id}`}
              value={answer.id}
              checked={isSelected}
              onChange={() => onAnswerChange(answer.id.toString())}
              style={{ marginRight: '8px' }}
            />
            {cleanAnswer}
            {(questionState === 'correct' || questionState === 'incorrect') && answer.isCorrect && (
              <span style={{ marginLeft: '8px', color: '#155724', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Multiple Choice Question
  const renderMultipleChoiceQuestion = () => (
    <div className="answer-options">
      <div style={{ marginBottom: '12px', fontWeight: '500' }}>Select one:</div>
      {previewData.answers.map((answer, index) => {
        const isSelected = selectedAnswer === answer.id.toString();
        const optionLabel = String.fromCharCode(97 + index); // a, b, c, d
        
        return (
          <div
            key={answer.id}
            style={getAnswerStyle(answer, isSelected)}
            onClick={() => onAnswerChange(answer.id.toString())}
          >
            <input
              type="radio"
              name={`question_${previewData.id}`}
              value={answer.id}
              checked={isSelected}
              onChange={() => onAnswerChange(answer.id.toString())}
              style={{ marginRight: '8px' }}
            />
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{optionLabel}.</span>
            <div dangerouslySetInnerHTML={{ __html: processHTMLContent(answer.text || answer.answer) }} />
            {(questionState === 'correct' || questionState === 'incorrect') && answer.isCorrect && (
              <span style={{ marginLeft: '8px', color: '#155724', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Matching Question
  const renderMatchingQuestion = () => {
    if (!previewData.matchSubquestions || previewData.matchSubquestions.length === 0) {
      return (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <p style={{ margin: '0' }}>
            This is a matching question. The matching pairs are not available in the preview.
          </p>
        </div>
      );
    }

    return (
      <div className="answer-options">
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#495057'
          }}>
            Matching Question Preview
          </h5>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#6c757d' 
          }}>
            In the actual quiz, drag items from the left to match with the correct answers on the right.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column - Questions */}
          <div>
            <h6 style={{ 
              margin: '0 0 15px 0', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#495057',
              borderBottom: '2px solid #007bff',
              paddingBottom: '5px'
            }}>
              Questions/Descriptions
            </h6>
            {previewData.matchSubquestions
              .filter(sq => sq.questiontext && sq.questiontext.trim())
              .map((subquestion, index) => (
              <div key={subquestion.id || index} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '10px',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: processHTMLContent(subquestion.questiontext) 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Right Column - Answers */}
          <div>
            <h6 style={{ 
              margin: '0 0 15px 0', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#495057',
              borderBottom: '2px solid #28a745',
              paddingBottom: '5px'
            }}>
              Answer Options
            </h6>
            {previewData.matchSubquestions
              .filter(sq => sq.answertext && sq.answertext.trim())
              .map((subquestion, index) => (
              <div key={`answer-${subquestion.id || index}`} style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #28a745',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#155724',
                textAlign: 'center'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: processHTMLContent(subquestion.answertext) 
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Show matching pairs for reference */}
        <div style={{ marginTop: '20px' }}>
          <details style={{ 
            backgroundColor: '#e7f3ff',
            border: '1px solid #b8daff',
            borderRadius: '4px',
            padding: '15px'
          }}>
            <summary style={{ 
              cursor: 'pointer',
              fontWeight: '600',
              color: '#004085',
              fontSize: '14px'
            }}>
              Show Correct Matching Pairs
            </summary>
            <div style={{ marginTop: '10px' }}>
              {previewData.matchSubquestions
                .filter(sq => sq.questiontext && sq.questiontext.trim() && sq.answertext && sq.answertext.trim())
                .map((subquestion, index) => (
                <div key={`pair-${subquestion.id || index}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #b8daff',
                  fontSize: '13px'
                }}>
                  <div style={{ flex: 1, color: '#004085' }}>
                    <div dangerouslySetInnerHTML={{ 
                      __html: processHTMLContent(subquestion.questiontext).replace(/<[^>]*>/g, '') 
                    }} />
                  </div>
                  <div style={{ padding: '0 15px', color: '#6c757d' }}>→</div>
                  <div style={{ flex: 1, fontWeight: '600', color: '#155724' }}>
                    <div dangerouslySetInnerHTML={{ 
                      __html: processHTMLContent(subquestion.answertext).replace(/<[^>]*>/g, '') 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    );
  };

  // Render Drag and Drop Image Question
  const renderDragDropImageQuestion = () => {
    if (!previewData.drags || previewData.drags.length === 0) {
      return (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          fontSize: '14px',
          color: '#6c757d'
        }}>
          <p style={{ margin: '0' }}>
            This is a drag-and-drop question, but no draggable items are available in the preview.
          </p>
        </div>
      );
    }

    return (
      <div className="answer-options">
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#495057'
          }}>
            Drag and Drop Question Preview
          </h5>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#6c757d' 
          }}>
            In the actual quiz, drag the images below to the appropriate drop zones in the question area.
          </p>
        </div>

        {/* Drop Zones Area */}
        {previewData.drops && previewData.drops.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h6 style={{ 
              margin: '0 0 15px 0', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#495057',
              borderBottom: '2px solid #dc3545',
              paddingBottom: '5px'
            }}>
              Drop Zones ({previewData.drops.length})
            </h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {previewData.drops.map((drop, index) => (
                <div
                  key={drop.drop_id || index}
                  style={{
                    width: '120px',
                    height: '80px',
                    border: '2px dashed #dc3545',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff5f5',
                    fontSize: '12px',
                    color: '#dc3545',
                    fontWeight: '500'
                  }}
                >
                  Drop Zone {drop.no || index + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draggable Items */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#495057',
            borderBottom: '2px solid #007bff',
            paddingBottom: '5px'
          }}>
            Draggable Items ({previewData.drags.length})
          </h6>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            {previewData.drags.map((drag, index) => (
              <div
                key={drag.drag_id || index}
                style={{
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  textAlign: 'center',
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {drag.fileurl ? (
                  <div>
                    <img
                      src={drag.fileurl}
                      alt={drag.filename || `Drag item ${drag.no || index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                        e.target.nextSibling.innerHTML = `
                          <div style="color: #dc3545; font-weight: 500;">Image Load Failed</div>
                          <div style="font-size: 10px; margin-top: 5px;">URL: ${drag.fileurl}</div>
                        `;
                      }}
                    />
                    <div 
                      style={{ 
                        display: 'none',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        fontSize: '12px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      Image failed to load
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6c757d',
                      fontWeight: '500',
                      marginTop: '5px'
                    }}>
                      Item {drag.no || index + 1}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '20px 10px',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}>
                    {drag.label || `Drag Item ${drag.no || index + 1}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Drag and Drop into Text Question (ddwtos)
  const renderDragDropIntoTextQuestion = () => {
    // Get drag items from the processed data
    const dragItems = previewData.dragItems || previewData.answers || [];
    
    // Process the question text to identify gaps and create interactive elements
    const processQuestionTextWithGaps = () => {
      let questionText = previewData.questiontext;
      
      // Replace [[1]], [[2]], etc. with interactive drop zones
      const gapPattern = /\[\[(\d+)\]\]/g;
      let gapIndex = 0;
      
      questionText = questionText.replace(gapPattern, (match, groupNumber) => {
        gapIndex++;
        const gapId = `gap_${gapIndex}`;
        
        return `<span class="drag-drop-gap" data-gap="${groupNumber}" data-gap-id="${gapId}" style="
          display: inline-block;
          min-width: 100px;
          min-height: 30px;
          border: 2px dashed #007bff;
          border-radius: 4px;
          margin: 0 4px;
          padding: 4px 8px;
          background-color: #f8f9ff;
          vertical-align: middle;
          position: relative;
          cursor: pointer;
        " title="Drop zone ${gapIndex}">
          <span style="color: #6c757d; font-size: 12px;">Drop here ${gapIndex}</span>
        </span>`;
      });
      
      return questionText;
    };

    return (
      <div className="answer-options">
        <div style={{
          backgroundColor: '#e7f3ff',
          border: '1px solid #b8daff',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h5 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#004085'
          }}>
             Drag and Drop into Text Question
          </h5>
          <p style={{ 
            margin: '0 0 10px 0', 
            fontSize: '14px', 
            color: '#004085' 
          }}>
            In the actual quiz, drag the words below into the correct gaps in the text above.
          </p>
        </div>

        {/* Enhanced Question Text with Interactive Gaps */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          fontSize: '16px',
          lineHeight: '1.8'
        }}>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: processQuestionTextWithGaps() 
            }}
          />
        </div>

        {/* Draggable Items */}
        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#495057',
            borderBottom: '2px solid #007bff',
            paddingBottom: '5px'
          }}>
             Draggable Words/Phrases ({dragItems.length} items)
          </h6>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '10px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            minHeight: '80px'
          }}>
            {dragItems.length > 0 ? dragItems.map((item, index) => {
              // Get the text content from multiple possible fields
              const itemText = item.label || item.text || item.answer || `Item ${index + 1}`;
              
              // Extract drag group info from feedback if available
              let dragGroup = 1;
              let isInfinite = false;
              
              try {
                // Parse the feedback which contains drag group info
                const feedbackText = item.feedback?.replace(/<[^>]*>/g, '') || '';
                if (feedbackText.includes('draggroup')) {
                  // This is a simplified parser - you might need to adjust based on your data
                  const groupMatch = feedbackText.match(/"draggroup";s:\d+:"(\d+)"/);
                  if (groupMatch) dragGroup = parseInt(groupMatch[1]);
                  
                  isInfinite = feedbackText.includes('"infinite";b:1');
                }
              } catch (e) {
                console.warn('Could not parse drag group info:', e);
              }

              return (
                <div
                  key={item.id || index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #007bff',
                    borderRadius: '6px',
                    cursor: 'grab',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#007bff',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                    minWidth: '60px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    e.target.style.backgroundColor = '#e3f2fd';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.target.style.backgroundColor = '#ffffff';
                  }}
                  title={`Drag item: ${itemText}\nGroup: ${dragGroup}${isInfinite ? ' (infinite use)' : ''}`}
                >
                  <span>{itemText}</span>
                  {isInfinite && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      ∞
                    </span>
                  )}
                </div>
              );
            }) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#6c757d',
                fontStyle: 'italic',
                width: '100%'
              }}>
                 No drag items found. Check if the question data contains answers or drags array.
              </div>
            )}
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
             Tip: Items with ∞ symbol can be used multiple times
          </div>
        </div>
      </div>
    );
  };

  // Render Essay Question
  const renderEssayQuestion = () => (
    <div className="answer-options">
      <textarea
        placeholder="Please write your answer here..."
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '10px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '14px',
          resize: 'vertical',
          fontFamily: 'inherit'
        }}
        disabled
      />
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
         Note: This is an essay question where students provide written responses.
      </div>
    </div>
  );

  // Render Short Answer Question
  const renderShortAnswerQuestion = () => (
    <div className="answer-options">
      <input
        type="text"
        placeholder="Answer:"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '16px'
        }}
        disabled
      />
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
         Note: Students enter a short text answer that is automatically graded.
      </div>
    </div>
  );

  // Render Numerical Question
  const renderNumericalQuestion = () => (
    <div className="answer-options">
      <input
        type="number"
        placeholder="Enter numerical answer"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '16px'
        }}
        disabled
      />
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
         Note: Students enter a numerical value with optional units.
      </div>
    </div>
  );

  // Render Calculated Question
  const renderCalculatedQuestion = () => (
    <div className="answer-options">
      <div style={{
        backgroundColor: '#e7f3ff',
        border: '1px solid #b8daff',
        borderRadius: '4px',
        padding: '15px',
        fontSize: '14px',
        color: '#004085'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
          <strong> Calculated Question Type: {questionTypes[previewData.qtype]}</strong>
        </p>
        <p style={{ margin: '0' }}>
          This question uses mathematical formulas with variables that are substituted with random values for each attempt.
        </p>
      </div>
      <input
        type="text"
        placeholder="Enter calculated answer"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '16px',
          marginTop: '15px'
        }}
        disabled
      />
    </div>
  );

  // Render other question types
  const renderOtherQuestionTypes = () => {
    const { qtype } = previewData;
    
    const questionTypeInfo = {
      'ddwtos': {
        icon: '',
        title: 'Drag and Drop into Text',
        description: 'This question type allows dragging words or phrases into gaps within the text.'
      },
      'ddmarker': {
        icon: '',
        title: 'Drag and Drop Markers',
        description: 'This question type allows placing markers on an image by dragging and dropping.'
      },
      'gapselect': {
        icon: '',
        title: 'Select Missing Words',
        description: 'This question type presents text with dropdown menus for students to select the correct missing words.'
      },
      'multianswer': {
        icon: '',
        title: 'Embedded Answers (Cloze)',
        description: 'This question type embeds multiple sub-questions within a passage of text, including multiple choice, short answer, and numerical questions.'
      },
      'ordering': {
        icon: '',
        title: 'Ordering',
        description: 'This question type requires students to arrange items in the correct order by dragging and dropping.'
      },
      'randomsamatch': {
        icon: '',
        title: 'Random Short-Answer Matching',
        description: 'This question randomly selects short answer questions from a category and presents them as a matching exercise.'
      },
      'description': {
        icon: 'ℹ',
        title: 'Description (Information Only)',
        description: 'This is not actually a question. It is a way to add instructions, rubrics, or other content to a quiz. No answer is required.',
        style: {
          backgroundColor: '#e8f5e8',
          color: '#155724',
          border: '1px solid #c3e6c3'
        }
      }
    };

    const info = questionTypeInfo[qtype] || {
      icon: '',
      title: questionTypes[qtype] || qtype,
      description: 'This question type requires special interaction that cannot be fully previewed in this format.'
    };

    return (
      <div className="answer-options">
        <div style={{
          backgroundColor: info.style?.backgroundColor || '#f8f9fa',
          border: info.style?.border || '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          fontSize: '14px',
          color: info.style?.color || '#6c757d'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
            <strong>{info.icon} {info.title}</strong>
          </p>
          <p style={{ margin: '0' }}>
            {info.description}
          </p>
        </div>
      </div>
    );
  };

  // Main render method for question types
  const renderQuestionByType = () => {
    if (!previewData?.qtype) return null;

    switch (previewData.qtype) {
      case 'truefalse':
        return renderTrueFalseQuestion();
      case 'multichoice':
        return renderMultipleChoiceQuestion();
      case 'match':
        return renderMatchingQuestion();
      case 'ddimageortext':
        return renderDragDropImageQuestion();
      case 'ddwtos':
        return renderDragDropIntoTextQuestion();
      case 'essay':
        return renderEssayQuestion();
      case 'shortanswer':
        return renderShortAnswerQuestion();
      case 'numerical':
        return renderNumericalQuestion();
      case 'calculated':
      case 'calculatedmulti':
      case 'calculatedsimple':
        return renderCalculatedQuestion();
      default:
        return renderOtherQuestionTypes();
    }
  };

  return (
    <div className="moodle-question-content">
      {/* Question Header */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '10px 15px',
        border: '1px solid #dee2e6',
        borderRadius: '4px 4px 0 0',
        borderBottom: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{
            margin: '0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              Version {previewData.version || 1} (latest)
            </span>
            {previewData.name}
          </h3>
          <button
            onClick={onRequestClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#6c757d',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Question Body */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #dee2e6',
        borderTop: 'none',
        padding: '20px',
        minHeight: '200px'
      }}>
        {/* Question Info */}
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#6c757d' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span><strong>Question 1</strong></span>
            <span>Not yet answered</span>
            <span>Marked out of {previewData.defaultmark}.00</span>
            {previewData.penalty > 0 && (
              <span>Penalty: {(previewData.penalty * 100).toFixed(1)}%</span>
            )}
            <span>Type: {questionTypes[previewData.qtype] || previewData.qtype}</span>
            <span style={{
              ...getStatusBadgeStyle(previewData.status),
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {previewData.status?.toUpperCase()}
            </span>
          </div>
          
          {/* Creator and Modifier Info */}
          {(previewData.createdBy?.name !== 'Unknown' || previewData.modifiedBy?.name !== 'Unknown') && (
            <div style={{
              fontSize: '12px',
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              padding: '8px 12px',
              borderRadius: '4px',
              marginTop: '8px'
            }}>
              {previewData.createdBy?.name !== 'Unknown' && (
                <div style={{ marginBottom: '4px' }}>
                  <strong>Created:</strong> {previewData.createdBy.date} by {previewData.createdBy.name}
                </div>
              )}
              {previewData.modifiedBy?.name !== 'Unknown' && (
                <div>
                  <strong>Modified:</strong> {previewData.modifiedBy.date} by {previewData.modifiedBy.name}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Text */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#212529'
            }}
            dangerouslySetInnerHTML={{ __html: processHTMLContent(previewData.questiontext) }}
          />
        </div>

        {/* Render question type specific content */}
        {renderQuestionByType()}
      </div>

      {/* Action Buttons */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        border: '1px solid #dee2e6',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button onClick={onStartAgain} style={buttonStyle}> Start again</button>
        <button onClick={onSave} style={buttonStyle}> Save</button>
        <button onClick={onFillCorrectResponses} style={buttonStyle}> Fill in correct responses</button>
        <button onClick={onSubmitAndFinish} style={buttonStyle}> Submit and finish</button>
        <button onClick={onRequestClose} style={buttonStyle}> Close preview</button>
      </div>
    </div>
  );
};