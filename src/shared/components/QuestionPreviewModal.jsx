// ============================================================================
// QuestionPreviewModal.jsx - Main Preview Component
// ============================================================================
import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-hot-toast';
// import { QuestionRenderer } from './preview/QuestionRenderer';
import { PreviewOptions } from './preview/PreviewOptions';
import { TechnicalInfo } from './preview/TechnicalInfo';
import { usePreviewData } from '../hooks/usePreviewData';
import { useComments } from '../hooks/useComments';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { CommentSection } from './preview/CommentSection';
import { resolveImageURL } from '../utils/imageUtils';
import QuestionRenderer from './preview/QuestionPreviewRenderer';

const QuestionPreviewModal = ({ 
  isOpen, 
  onRequestClose, 
  question,
  onEdit,
  onDuplicate,
  onDelete 

}) => {
  // State management
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [questionState, setQuestionState] = useState('todo');
  const [showComments, setShowComments] = useState(false);
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);

  // Preview settings
  const [previewSettings, setPreviewSettings] = useState({
    questionVersion: 'latest',
    behavior: 'deferred',
    markedOutOf: 1,
    showCorrect: 'shown',
    marks: 'show_mark_and_max',
    decimalPlaces: 2,
    specificFeedback: 'shown',
    generalFeedback: 'shown',
    rightAnswer: 'shown',
    responseHistory: 'not_shown'
  });

  // Custom hooks
  const { currentUser } = useCurrentUser(); 

  const { 
    previewData, 
    technicalInfo, 
    loading, 
    error, 
    fetchPreviewData 
  } = usePreviewData();
  
  const {
    comments,
    setComments,
    addingComment,
    addComment,
    deleteComment,
    fetchComments
  } = useComments();

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && question?.id) {
      fetchPreviewData(question.id, question);
      fetchComments(question.id);
    }
  }, [isOpen, question?.id]);

  // Handle answer selection
  const handleAnswerChange = (answerId) => {
    setSelectedAnswer(answerId);
    setQuestionState('answered');
    console.log(`Answer selected: ${answerId}`);
  };

  // Handle action buttons
  const handleStartAgain = () => {
    setSelectedAnswer('');
    setQuestionState('todo');
    toast.success('Question restarted');
  };

  const handleSave = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer first');
      return;
    }
    toast.success('Answer saved');
  };

  const handleFillCorrectResponses = () => {
    if (previewData?.answers) {
      const correctAnswer = previewData.answers.find(answer => answer.isCorrect);
      if (correctAnswer) {
        setSelectedAnswer(correctAnswer.id.toString());
        setQuestionState('correct');
        toast.success('Correct answer filled in');
      } else {
        toast.error('No correct answer found');
      }
    }
  };

  const handleSubmitAndFinish = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer first');
      return;
    }

    const selectedAnswerData = previewData.answers.find(
      answer => answer.id.toString() === selectedAnswer
    );
    
    if (selectedAnswerData?.isCorrect) {
      setQuestionState('correct');
      toast.success('Correct! Well done.');
    } else {
      setQuestionState('incorrect');
      toast.error('Incorrect. The correct answer is highlighted.');
    }
  };

  // Modal styles
  const modalStyles = {
    overlay: {
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    content: {
      maxWidth: '95vw',
      width: '1000px',
      margin: 'auto',
      maxHeight: '95vh',
      overflowY: 'auto',
      top: '2.5%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translateX(-50%)',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }
  };

  // Loading state
  if (loading) {
    return (
      <ReactModal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Question Preview"
        style={{
          overlay: { zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          content: {
            maxWidth: '800px',
            margin: 'auto',
            top: '10%',
            padding: '40px',
            textAlign: 'center'
          }
        }}
      >
        <div style={{ fontSize: '18px', color: '#6c757d' }}>
           Loading preview data from API...
        </div>
      </ReactModal>
    );
  }

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Question Preview - Enhanced for All Question Types"
      style={modalStyles}
    >
      <div className="moodle-preview-container">
        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            <strong>Error loading preview:</strong> {error}
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              Using fallback question data...
            </div>
          </div>
        )}

        {/* Main Question Content */}
        {previewData && (
      //   <QuestionRenderer
      //   previewData={previewData}
      //   selectedAnswer={selectedAnswer}
      //   questionState={questionState}
      //   onAnswerChange={handleAnswerChange}
      //   onStartAgain={handleStartAgain}
      //   onSave={handleSave}
      //   onFillCorrectResponses={handleFillCorrectResponses}
      //   onSubmitAndFinish={handleSubmitAndFinish}
      //   onRequestClose={onRequestClose}
      //   resolveImageURL={resolveImageURL} //  NEW PROP
      // />
      // In QuestionPreviewModal.jsx - this should work as-is
<QuestionRenderer
  previewData={previewData}
  selectedAnswer={selectedAnswer}
  questionState={questionState}
  onAnswerChange={handleAnswerChange}
  onStartAgain={handleStartAgain}
  onSave={handleSave}
  onFillCorrectResponses={handleFillCorrectResponses}
  onSubmitAndFinish={handleSubmitAndFinish}
  onRequestClose={onRequestClose}
  resolveImageURL={resolveImageURL}
/>

        )}

        {/* Comments Section */}
        <CommentSection
          comments={comments}
          setComments={setComments  }
          currentUser={currentUser}
          addingComment={addingComment}
          onDeleteComment={deleteComment} 
          onAddComment={addComment}
          showComments={true}
          setShowComments={() => {}}

          questionId={previewData?.id}
        />

        {/* Preview Options */}
        <PreviewOptions
          previewSettings={previewSettings}
          setPreviewSettings={setPreviewSettings}
          showPreviewOptions={showPreviewOptions}
          setShowPreviewOptions={setShowPreviewOptions}
          showDisplayOptions={showDisplayOptions}
          setShowDisplayOptions={setShowDisplayOptions}
          defaultMark={previewData?.defaultmark}
        />

        {/* Technical Information */}
        <TechnicalInfo
          technicalInfo={technicalInfo}
          showTechnicalInfo={showTechnicalInfo}
          setShowTechnicalInfo={setShowTechnicalInfo}
          previewData={previewData}
          error={error}
        />
      </div>
    </ReactModal>
  );
};

export default QuestionPreviewModal;