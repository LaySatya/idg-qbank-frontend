// ============================================================================
// Consolidated Question Constants
// ============================================================================

// Question Types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multichoice',
  TRUE_FALSE: 'truefalse',
  SHORT_ANSWER: 'shortanswer',
  ESSAY: 'essay'
};

// Question Statuses
export const QUESTION_STATUSES = {
  DRAFT: 'draft',
  READY: 'ready', 
  REVIEW: 'review',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived'
};

// Default Question Templates
export const DEFAULT_MULTIPLE_CHOICE_QUESTION = {
  id: null,
  title: '',
  questionText: '',
  qtype: 'multichoice',
  defaultMark: 1,
  generalFeedback: '',
  questionStatus: 'ready',
  tags: [],
  choices: [],
  multipleAnswers: false,
  shuffleAnswers: true,
  showInstructions: false,
  penaltyFactor: 0.1,
  idNumber: '',
  version: 'v1',
  category: ''
};

export const DEFAULT_TRUE_FALSE_QUESTION = {
  id: null,
  title: '',
  questionText: '',
  qtype: 'truefalse',
  defaultMark: 1,
  generalFeedback: '',
  questionStatus: 'ready',
  tags: [],
  correctAnswer: true,
  feedbackTrue: 'Correct!',
  feedbackFalse: 'Incorrect!',
  penaltyFactor: 0.1
};

// Default Choices
export const DEFAULT_CHOICES = [
  { id: 'choice-1', text: '', answer: '', grade: 'None', feedback: '' },
  { id: 'choice-2', text: '', answer: '', grade: 'None', feedback: '' },
  { id: 'choice-3', text: '', answer: '', grade: 'None', feedback: '' },
  { id: 'choice-4', text: '', answer: '', grade: 'None', feedback: '' }
];

export const AVAILABLE_TAGS = [
  "math",
  "science",
  "history",
  "geography",
  "literature"
  // Add more tags as needed
];

export const BULK_EDIT_COMPONENTS = [
  // Example: Add your bulk edit component names or configs here
  "BulkEditStatus",
  "BulkEditTags",
  "BulkEditCategory",
  // ...add more as needed
];
export const EDIT_COMPONENTS = [
  // Add your edit component names or configs here
  "EditStatus",
  "EditTags",
  "EditCategory",
  // ...add more as needed
];
// Grade Options
export const GRADE_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: '100%', label: '100%' },
  { value: '50%', label: '50%' },
  { value: '33.33333%', label: '33.33333%' },
  { value: '25%', label: '25%' },
  { value: '20%', label: '20%' },
  { value: '16.66667%', label: '16.66667%' },
  { value: '14.28571%', label: '14.28571%' },
  { value: '12.5%', label: '12.5%' },
  { value: '11.11111%', label: '11.11111%' },
  { value: '10%', label: '10%' },
  { value: '-5%', label: '-5%' },
  { value: '-10%', label: '-10%' },
  { value: '-20%', label: '-20%' },
  { value: '-25%', label: '-25%' },
  { value: '-33.33333%', label: '-33.33333%' },
  { value: '-50%', label: '-50%' },
  { value: '-100%', label: '-100%' }
];

// Status Options
export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' }
];
