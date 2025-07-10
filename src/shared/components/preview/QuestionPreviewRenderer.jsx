// ============================================================================
// QuestionPreviewRenderer.jsx - Enhanced for All Question Types
// ============================================================================
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Image, Check, X, RotateCcw, Download, Eye, EyeOff, Calculator, FileText, Target, Hash, Grid3x3, ArrowUpDown, HelpCircle, Shuffle } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const QuestionPreviewRenderer = ({ 
  previewData, 
  selectedAnswer, 
  questionState, 
  onAnswerChange, 
  onStartAgain, 
  onSave, 
  onFillCorrectResponses, 
  onSubmitAndFinish, 
  onRequestClose,
  resolveImageURL 
}) => {
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [draggedItems, setDraggedItems] = useState({});
  const [localSelectedAnswers, setLocalSelectedAnswers] = useState({});
const [qtypeIcons, setQtypeIcons] = useState({});
console.log('previewData:', previewData);
const getUserDisplay = (user) => {
  if (!user) return 'Unknown';
  const name = `${user.firstname || ''}${user.lastname ? ' ' + user.lastname : ''}`.trim();
  if (name) return name;
  if (user.email) return user.email;
  return 'Unknown';
};
useEffect(() => {
  async function fetchQtypeIcons() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions/qtypes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      const iconMap = {};
      data.forEach(qt => {
        iconMap[qt.name] = qt;
      });
      setQtypeIcons(iconMap);
    } catch {
      setQtypeIcons({});
    }
  }
  fetchQtypeIcons();
}, []);
  if (!previewData) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No preview data available</p>
      </div>
    );
  }

  // const getQuestionTypeInfo = (qtype) => {
  //   const types = {
  //     'multichoice': { label: 'Multiple choice', icon: '☑️', color: 'bg-blue-100 border-blue-300' },
  //     'truefalse': { label: 'True/False', icon: '✓/✗', color: 'bg-green-100 border-green-300' },
  //     'essay': { label: 'Essay', icon: '📄', color: 'bg-gray-100 border-gray-300' },
  //     'shortanswer': { label: 'Short answer', icon: '✏️', color: 'bg-emerald-100 border-emerald-300' },
  //     'numerical': { label: 'Numerical', icon: '🔢', color: 'bg-cyan-100 border-cyan-300' },
  //     'ddimageortext': { label: 'Drag and drop onto image', icon: '🎯', color: 'bg-purple-100 border-purple-300' },
  //     'ddmarker': { label: 'Drag and drop markers', icon: '📍', color: 'bg-red-100 border-red-300' },
  //     'ddwtos': { label: 'Drag and drop into text', icon: '📝', color: 'bg-orange-100 border-orange-300' },
  //     'gapselect': { label: 'Select missing words', icon: '🔤', color: 'bg-yellow-100 border-yellow-300' },
  //     'match': { label: 'Matching', icon: '🔗', color: 'bg-indigo-100 border-indigo-300' },
  //     'randomsamatch': { label: 'Random short-answer matching', icon: '🎲', color: 'bg-pink-100 border-pink-300' },
  //     'calculated': { label: 'Calculated', icon: '🧮', color: 'bg-teal-100 border-teal-300' },
  //     'calculatedmulti': { label: 'Calculated multichoice', icon: '🔢', color: 'bg-lime-100 border-lime-300' },
  //     'calculatedsimple': { label: 'Calculated simple', icon: '➕', color: 'bg-green-200 border-green-400' },
  //     'multianswer': { label: 'Embedded answers (Cloze)', icon: '🧩', color: 'bg-violet-100 border-violet-300' },
  //     'ordering': { label: 'Ordering', icon: '📋', color: 'bg-amber-100 border-amber-300' },
  //     'description': { label: 'Description', icon: 'ℹ️', color: 'bg-slate-100 border-slate-300' },
  //     'random': { label: 'Random', icon: '🎯', color: 'bg-rose-100 border-rose-300' },
  //     'missingtype': { label: 'Missing question type', icon: '❓', color: 'bg-gray-200 border-gray-400' }
  //   };
  //   return types[qtype] || { label: qtype, icon: '❓', color: 'bg-gray-100 border-gray-300' };
  // };
const getQuestionTypeInfo = (qtype) => {
  const apiType = qtypeIcons[qtype];
  if (apiType) {
    return {
      label: apiType.label || qtype,
      icon: (
        <img
          src={apiType.iconurl}
          alt={apiType.label}
          style={{
            width: 20,
            height: 20,
            display: 'inline',
            verticalAlign: 'middle',
            marginRight: 6,
            borderRadius: 4,
            background: '#fff'
          }}
        />
      ),
      color: 'bg-blue-100 border-blue-300' // You can customize or add color in your API
    };
  }
  // fallback to emoji if not found
  const types = {
    'multichoice': { label: 'Multiple choice', icon: '', color: 'bg-blue-100 border-blue-300' },
    'truefalse': { label: 'True/False', icon: '✓/✗', color: 'bg-green-100 border-green-300' },
    // ...rest of your fallback types...
  };
  return types[qtype] || { label: qtype, icon: '', color: 'bg-gray-100 border-gray-300' };
};
  const typeInfo = getQuestionTypeInfo(previewData.qtype);

  const renderQuestionHeader = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${typeInfo.color}`}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className="text-sm text-gray-500">
            Question {previewData.id} • Version {previewData.version || 1}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showCorrectAnswers ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showCorrectAnswers ? 'Hide' : 'Show'} Answers</span>
          </button>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {previewData.name || `Question ${previewData.id}`}
      </h2>
      
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>Marked out of {previewData.defaultmark || 1}</span>
        <span>Status: {previewData.status || 'draft'}</span>
        {previewData.penalty && <span>Penalty: {previewData.penalty}</span>}
      </div>
    </div>
  );

  const renderQuestionText = () => {
    // Process question text to resolve image URLs
    let processedQuestionText = previewData.questiontext;
    
    if (resolveImageURL && processedQuestionText) {
      // Replace @@PLUGINFILE@@ and other image URLs
      processedQuestionText = processedQuestionText.replace(/src="([^"]*@@PLUGINFILE@@[^"]*)"/g, (match, url) => {
        const resolvedUrl = resolveImageURL(url, previewData.id);
        console.log(' Resolved question text image:', { original: url, resolved: resolvedUrl });
        return `src="${resolvedUrl}"`;
      });
      
      // Also handle other pluginfile.php URLs
      processedQuestionText = processedQuestionText.replace(/src="([^"]*pluginfile\.php[^"]*)"/g, (match, url) => {
        if (!url.startsWith('http')) {
          const resolvedUrl = resolveImageURL(url, previewData.id);
          console.log('Resolved pluginfile image:', { original: url, resolved: resolvedUrl });
          return `src="${resolvedUrl}"`;
        }
        return match;
      });
    }

    return (
      <div className="prose max-w-none mb-6">
                           <div 
                      className="text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: processedQuestionText.replace(/<img[^>]*>/g, '') }}
                    />
      </div>
    );
  };

  const renderMultipleChoice = () => (
    
    <div className="space-y-3">
           {previewData.answers?.map((answer, index) => {
        console.log('MC answer:', answer.answer);
     
        const isSelected = selectedAnswer === answer.id || localSelectedAnswers[previewData.id] === answer.id;
        const isCorrect = answer.fraction > 0;
        const showAsCorrect = showCorrectAnswers && isCorrect;
        const showAsIncorrect = showCorrectAnswers && isSelected && !isCorrect;
        
        return (
          <div
            key={answer.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              showAsCorrect 
                ? 'border-green-400 bg-green-50' 
                : showAsIncorrect 
                ? 'border-red-400 bg-red-50'
                : isSelected 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => {
              setLocalSelectedAnswers({...localSelectedAnswers, [previewData.id]: answer.id});
              if (onAnswerChange) onAnswerChange(answer.id);
            }}
          >

                     
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div className="flex-1">
                <div dangerouslySetInnerHTML={{ __html: answer.answer.replace(/<img[^>]*>/g, '') }} />
                {answer.feedback && showCorrectAnswers && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    Feedback: {answer.feedback}
                  </div>
                )}
              </div>
              {showCorrectAnswers && isCorrect && (
                <Check className="text-green-600" size={20} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="space-y-3">
      {['True', 'False'].map((option) => {
        const isSelected = selectedAnswer === option || localSelectedAnswers[previewData.id] === option;
        const correctAnswer = previewData.usages?.[0]?.attempts?.[0]?.rightanswer;
        const isCorrect = correctAnswer === option;
        const showAsCorrect = showCorrectAnswers && isCorrect;
        
        return (
          <div
            key={option}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              showAsCorrect 
                ? 'border-green-400 bg-green-50' 
                : isSelected 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => {
              setLocalSelectedAnswers({...localSelectedAnswers, [previewData.id]: option});
              if (onAnswerChange) onAnswerChange(option);
            }}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="font-medium">{option}</span>
              {showCorrectAnswers && isCorrect && (
                <Check className="text-green-600 ml-auto" size={20} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDragDropImage = () => {
    // Use the same working method as your old code
    const TOKEN = import.meta.env.VITE_MOODLE_TOKEN;
    
    const getImageUrl = (fileurl) => {
      if (!fileurl) return null;
      return `${fileurl.replace('/pluginfile.php', '/webservice/pluginfile.php')}?token=${TOKEN}`;
    };

    return (
      <div className="space-y-6">
        {/* Background Image with Drop Zones (if available) */}
        {previewData.backgroundurl ? (
          <div className="relative border rounded-lg overflow-hidden bg-white">
            <img
              src={getImageUrl(previewData.backgroundurl)}
              alt="Question background"
              className="w-full h-auto"
              onLoad={() => console.log(' Background image loaded')}
              onError={(e) => console.error(' Background image failed:', e.target.src)}
            />
            
            {/* Positioned Drop Zones Overlay */}
            {previewData.drops?.map((drop, index) => (
              <div
                key={drop.drop_id || index}
                className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-60 rounded flex items-center justify-center text-blue-800 font-bold text-sm hover:bg-opacity-80 transition-all cursor-pointer"
                style={{
                  left: drop.coords ? `${drop.coords.split(',')[0] || 0}px` : `${50 + (index * 100)}px`,
                  top: drop.coords ? `${drop.coords.split(',')[1] || 0}px` : `${50 + (index * 30)}px`,
                  width: drop.coords ? `${drop.coords.split(',')[2] || 80}px` : '80px',
                  height: drop.coords ? `${drop.coords.split(',')[3] || 50}px` : '50px',
                }}
                title={`Drop Zone ${drop.no || index + 1}`}
              >
                {drop.no || index + 1}
              </div>
            ))}
          </div>
        ) : (
          /* No background image - show drop zones inline */
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">
              <Image size={32} className="mx-auto mb-2" />
              <p className="text-sm">This question has no background image.</p>
            </div>
            
            {/* Inline Drop Zones */}
            {previewData.drops?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {previewData.drops.map((drop, index) => (
                  <div
                    key={drop.drop_id || index}
                    className="border-2 border-dashed border-blue-500 bg-blue-50 rounded px-4 py-2 text-blue-700 font-medium"
                  >
                    Drop Zone {drop.no || index + 1}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drop Zones Reference (simplified) */}
        {previewData.drops?.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2">Drop Zones</h4>
            <div className="grid grid-cols-5 gap-3">
              {previewData.drops.map((drop, index) => (
                <div
                  key={drop.drop_id || index}
                  className="h-16 border-2 border-dashed border-blue-400 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-semibold text-sm"
                >
                  Zone {drop.no || index + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draggable Items use for call image  */}
        {previewData.drags?.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2">Draggable Items</h4>
            <div className="flex flex-wrap gap-4">
              {previewData.drags.map((drag, index) => {
                const imageUrl = getImageUrl(drag.fileurl);
                
                return (
                  <div key={drag.drag_id || index} className="w-24 text-center space-y-2">
                    <div className="w-24 h-16 bg-white border border-gray-300 rounded flex items-center justify-center shadow-sm hover:shadow-md transition-shadow cursor-move overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={drag.filename || 'Drag item'}
                          className="w-full h-full object-contain"
                          onLoad={() => console.log(` Drag image loaded: ${drag.filename}`)}
                          onError={(e) => {
                            console.error(` Drag image failed: ${drag.filename}`);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden w-full h-full flex items-center justify-center text-xs text-gray-600">
                        {drag.label || drag.filename || `Item ${index + 1}`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {drag.filename || drag.label || `Item ${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDragDropText = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
           Drag and drop the words into the correct positions in the text below.
        </p>
      </div>
      
      {previewData.answers?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Available Choices</h4>
          <div className="flex flex-wrap gap-2">
            {previewData.answers.map((answer, index) => (
              <div
                key={answer.id}
                className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-md text-blue-800 font-medium cursor-move hover:bg-blue-200 transition-colors"
              >
                {answer.answer}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div dangerouslySetInnerHTML={{ __html: previewData.questiontext }} />
      </div>
    </div>
  );

  const renderGapSelect = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Select the correct words from the dropdown menus to complete the text.
        </p>
      </div>
      
      {previewData.answers?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Available Options</h4>
          <div className="flex flex-wrap gap-2">
            {previewData.answers.map((answer, index) => (
              <span
                key={answer.id}
                className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700"
              >
                {answer.answer}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div dangerouslySetInnerHTML={{ __html: previewData.questiontext }} />
      </div>
    </div>
  );

  const [matchingSelections, setMatchingSelections] = useState({});
  const [matchingResults, setMatchingResults] = useState({});
  
  const renderMatching = () => {
    // Collect all possible answers (deduplicate by text)
    const answerOptions = Array.from(
      new Set(
        (previewData.matchSubquestions || [])
          .map(subq => subq.answertext?.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean)
      )
    );
  
    // Prepare correct answers for comparison
    const correctAnswers = {};
    (previewData.matchSubquestions || []).forEach(subq => {
      correctAnswers[subq.id] = subq.answertext?.replace(/<[^>]+>/g, '').trim();
    });
  
    // When showCorrectAnswers is true, compare user selections to correct answers
    const showFeedback = showCorrectAnswers;
  
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            Match each item on the left with the correct answer on the right.
          </p>
        </div>
        {(previewData.matchSubquestions || []).map((subq, idx) => {
          const userAnswer = matchingSelections[subq.id] || '';
          const correctAnswer = correctAnswers[subq.id];
          const isCorrect = userAnswer && userAnswer === correctAnswer;
  
          return (
            <div key={subq.id || idx} className="flex items-center gap-4 mb-2">
              <div
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: subq.questiontext }}
              />
              <select
                className={`border rounded px-2 py-1 ${showFeedback ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                value={userAnswer}
                disabled={showFeedback}
                onChange={e =>
                  setMatchingSelections({
                    ...matchingSelections,
                    [subq.id]: e.target.value
                  })
                }
              >
                <option value="">Select answer</option>
                {answerOptions.map((ans, i) => (
                  <option key={i} value={ans}>{ans}</option>
                ))}
              </select>
              {showFeedback && (
                isCorrect ? (
                  <Check className="text-green-600" size={20} />
                ) : (
                  <>
                    <X className="text-red-600" size={20} />
                    <span className="text-xs text-gray-500 ml-2">
                      Correct: <span className="font-semibold text-green-700">{correctAnswer}</span>
                    </span>
                  </>
                )
              )}
            </div>
          );
        })}
        {showFeedback && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
            Feedback: You have correctly selected {
              Object.keys(correctAnswers).filter(
                id => matchingSelections[id] === correctAnswers[id]
              ).length
            } out of {Object.keys(correctAnswers).length}.
          </div>
        )}
      </div>
    );
  };
  const renderNumerical = () => (
    <div className="space-y-4">
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-cyan-800 text-sm">
           Enter your numerical answer in the field below.
        </p>
      </div>
      
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer:
        </label>
        <input
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your answer..."
        />
      </div>
      
      {showCorrectAnswers && previewData.answers?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Correct Answers:</h4>
          <div className="space-y-1">
            {previewData.answers
              .filter(answer => answer.fraction > 0)
              .map((answer, index) => (
                <div key={answer.id} className="text-green-700">
                  {answer.answer}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEssayOrShortAnswer = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-purple-800 text-sm">
          Provide your {previewData.qtype === 'essay' ? 'detailed' : 'brief'} answer below.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer:
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={previewData.qtype === 'essay' ? 8 : 3}
          placeholder={`Enter your ${previewData.qtype === 'essay' ? 'essay' : 'short answer'} here...`}
        />
      </div>
    </div>
  );

  const renderCalculated = () => (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <p className="text-teal-800 text-sm">
           This question uses calculated values. Variables will be randomly generated.
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Sample Variables:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">a = </span>
            <span className="text-blue-600">5.2</span>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium">b = </span>
            <span className="text-blue-600">3.7</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer:
        </label>
        <input
          type="number"
          step="any"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter calculated result..."
        />
      </div>
    </div>
  );

  const renderDescription = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-slate-800 text-sm">
           This is an information-only question. No answer is required.
        </p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Information</h3>
        <div className="text-blue-800">
          <div dangerouslySetInnerHTML={{ __html: previewData.questiontext }} />
        </div>
      </div>
    </div>
  );

  const renderQuestionContent = () => {
    switch (previewData.qtype) {
      case 'multichoice':
        return renderMultipleChoice();
      case 'truefalse':
        return renderTrueFalse();
      case 'ddimageortext':
        return renderDragDropImage();
      case 'ddwtos':
        return renderDragDropText();
      case 'gapselect':
        return renderGapSelect();
      case 'match':
        return renderMatching();
      case 'numerical':
        return renderNumerical();
      case 'essay':
      case 'shortanswer':
        return renderEssayOrShortAnswer();
      case 'calculated':
      case 'calculatedmulti':
      case 'calculatedsimple':
        return renderCalculated();
      case 'description':
        return renderDescription();
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Question type "{previewData.qtype}" preview is being displayed with basic rendering.
            </p>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div dangerouslySetInnerHTML={{ __html: previewData.questiontext }} />
            </div>
          </div>
        );
    }
  };
const renderActionButtons = () => {
  const handleStartAgain = () => {
        setLocalSelectedAnswers({});
    setLocalSelectedAnswers({});
    setMatchingSelections({}); 
    setShowCorrectAnswers(false);
    if (onStartAgain) onStartAgain();
  };

  const handleFillCorrectResponses = () => {
    setShowCorrectAnswers(true);
  
    if (previewData.qtype === 'multichoice' && previewData.answers) {
      const correctAnswer = previewData.answers.find(answer => answer.fraction > 0);
      if (correctAnswer) {
        setLocalSelectedAnswers({...localSelectedAnswers, [previewData.id]: correctAnswer.id});
        if (onAnswerChange) onAnswerChange(correctAnswer.id);
      }
    }
  
    if (previewData.qtype === 'truefalse') {
      const correctAnswer = previewData.usages?.[0]?.attempts?.[0]?.rightanswer || 'True';
      setLocalSelectedAnswers({...localSelectedAnswers, [previewData.id]: correctAnswer});
      if (onAnswerChange) onAnswerChange(correctAnswer);
    }
  
    if (previewData.qtype === 'numerical' && previewData.answers) {
      const correctAnswer = previewData.answers.find(answer => answer.fraction > 0);
      if (correctAnswer) {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
          input.value = correctAnswer.answer;
        });
      }
    }
  
    // --- ADD THIS FOR MATCHING ---
    if (previewData.qtype === 'match' && previewData.matchSubquestions) {
      const correctSelections = {};
      previewData.matchSubquestions.forEach(subq => {
        // Remove HTML tags from answertext
        correctSelections[subq.id] = subq.answertext?.replace(/<[^>]+>/g, '').trim();
      });
      setMatchingSelections(correctSelections);
    }
    // --- END ADD ---
  
    if (onFillCorrectResponses) onFillCorrectResponses();
  };

  const handleSubmitAndFinish = () => {
  let hasAnswers = false;

  if (previewData.qtype === 'match') {
    hasAnswers = Object.keys(matchingSelections).length > 0;
  } else {
    hasAnswers = Object.keys(localSelectedAnswers).length > 0 || selectedAnswer;
  }

  if (!hasAnswers && previewData.qtype !== 'description') {
    // alert removed
    return;
  }

    setShowCorrectAnswers(true);

    let isCorrect = false;

    if (previewData.qtype === 'multichoice' && previewData.answers) {
      const selectedAnswerId = localSelectedAnswers[previewData.id] || selectedAnswer;
      const selectedAnswerData = previewData.answers.find(a => a.id.toString() === selectedAnswerId?.toString());
      isCorrect = selectedAnswerData?.fraction > 0;
    }

    if (previewData.qtype === 'truefalse') {
      const correctAnswer = previewData.usages?.[0]?.attempts?.[0]?.rightanswer || 'True';
      const selectedAnswerValue = localSelectedAnswers[previewData.id] || selectedAnswer;
      isCorrect = selectedAnswerValue === correctAnswer;
    }

    // alert removed

    if (onSubmitAndFinish) onSubmitAndFinish();
  };

  const handleSave = () => {
    if (onSave) onSave();
    // alert removed
  };

  return (
    <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={handleStartAgain}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors flex items-center space-x-2"
          title="Reset the question to start over"
        >
          <RotateCcw size={16} />
          <span>Start again</span>
        </button>
        
        <button 
          onClick={handleFillCorrectResponses}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
          title="Show and fill in all correct answers"
        >
          Fill correct responses
        </button>
        
        <button 
          onClick={handleSubmitAndFinish}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
          title="Submit your answers and see results"
        >
          Submit and finish
        </button>
        
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
          title="Save your current progress"
        >
          Save
        </button>
        
        <button 
          onClick={onRequestClose}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors ml-auto"
          title="Close the preview"
        >
          Close preview
        </button>
      </div>

      {/* Status Messages */}
      {showCorrectAnswers && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2 text-blue-800">
            <Check size={16} />
            <span className="text-sm font-medium">
              Correct answers are now highlighted. Review the feedback above.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {renderQuestionHeader()}
      
      <div className="p-6">
        {renderQuestionText()}
        {renderQuestionContent()}
      </div>
      
      {renderActionButtons()}
      
      {/* Question Info Panel - Simplified */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            <span>Question Information</span>
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
          </summary>
                   <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created by:</span>
                      <div>
                        {previewData.createdBy?.name || previewData.createdBy?.id || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Modified by:</span>
                      <div>
                        {previewData.modifiedBy?.name || previewData.modifiedBy?.id || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div>
                        {previewData.createdBy?.date ||
                          (previewData.timecreated ? new Date(previewData.timecreated * 1000).toLocaleDateString() : 'Unknown')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Modified:</span>
                      <div>
                        {previewData.modifiedBy?.date ||
                          (previewData.timemodified ? new Date(previewData.timemodified * 1000).toLocaleDateString() : 'Unknown')}
                      </div>
                    </div>
                  </div>
        </details>
      </div>
    </div>
  );
};

export default QuestionPreviewRenderer;