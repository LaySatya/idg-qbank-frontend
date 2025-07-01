import React, { useState, useCallback } from 'react';
import { 
  Upload, ArrowLeft, AlertTriangle, 
  CheckCircle, Eye, X 
} from 'lucide-react';
import { parseXMLToQuestions } from '../utils/xmlParser';

const XMLQuestionImporter = ({ onImport, onCancel }) => {
  const [xmlFile, setXmlFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.xml')) {
      setError('Please upload an XML file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const questions = parseXMLToQuestions(text);
      setParsedQuestions(questions);
      setSelectedQuestions(questions.map(q => q.id));
    } catch (err) {
      setError('Failed to parse XML file: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setXmlFile(file);
      handleFileUpload(file);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const importSelectedQuestions = () => {
    const questionsToImport = parsedQuestions.filter(q => selectedQuestions.includes(q.id));
    onImport(questionsToImport);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Import Questions from XML</h1>
            <p className="text-sm text-gray-600 mt-2">
              Upload an XML file containing quiz questions to import them into the question bank.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Question Bank
          </button>
        </div>

        {/* File Upload Section */}
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <div className="mb-4">
              <label htmlFor="xml-file" className="cursor-pointer">
                <span className="text-lg text-blue-600 hover:text-blue-700 font-semibold">
                  Choose XML file
                </span>
                <input
                  id="xml-file"
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-gray-500 text-sm mt-2">or drag and drop it here</p>
            </div>
            
            {xmlFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Selected file:</strong> {xmlFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {(xmlFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Parsing XML file...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle size={20} className="text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Questions Preview */}
        {parsedQuestions.length > 0 && (
          <div className="border-t border-gray-200">
            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Found {parsedQuestions.length} questions
                </h2>
                <button
                  onClick={importSelectedQuestions}
                  disabled={selectedQuestions.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import {selectedQuestions.length} Selected Questions
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={selectedQuestions.length === parsedQuestions.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuestions(parsedQuestions.map(q => q.id));
                          } else {
                            setSelectedQuestions([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedQuestions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestionSelection(question.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                          {question.questiontext || question.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {question.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {question.options ? `${question.options.length} options` : 'No options'}
                          {question.multiSelect && (
                            <span className="block text-xs text-blue-600">
                              (Multiple select - {question.correctAnswers?.length || 2} correct)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-600 mr-2" />
                          <span className="text-sm text-gray-700">Ready to import</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setPreviewQuestion(question)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Preview question"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Question Preview</h2>
                <button
                  onClick={() => setPreviewQuestion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <strong className="block mb-2">Question Text:</strong>
                  <p className="text-gray-700">{previewQuestion.questiontext}</p>
                </div>

                {previewQuestion.options && (
                  <div>
                    <strong className="block mb-2">Options:</strong>
                    <ul className="list-disc pl-5">
                      {previewQuestion.options.map((option, index) => (
                        <li key={index} className="text-gray-700 mb-1">
                          {option}
                          {previewQuestion.correctAnswers && previewQuestion.correctAnswers.includes(option) && (
                            <span className="ml-2 text-green-600 font-semibold">(Correct)</span>
                          )}
                          {!previewQuestion.correctAnswers && previewQuestion.correctAnswer?.includes(option) && (
                            <span className="ml-2 text-green-600 font-semibold">(Correct)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {previewQuestion.multiSelect && (
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Note:</strong> This is a multiple-select question. Students must choose {previewQuestion.correctAnswers?.length || 2} correct answers.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <strong className="block mb-2">Type:</strong>
                    <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {previewQuestion.type}
                    </span>
                  </div>

                  <div>
                    <strong className="block mb-2">Category:</strong>
                    <span className="text-gray-700">{previewQuestion.category}</span>
                  </div>

                  <div>
                    <strong className="block mb-2">Difficulty:</strong>
                    <span className="text-gray-700">{previewQuestion.difficulty}</span>
                  </div>

                  <div>
                    <strong className="block mb-2">Status:</strong>
                    <span className={`px-2 py-1 rounded text-xs ${previewQuestion.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {previewQuestion.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XMLQuestionImporter;