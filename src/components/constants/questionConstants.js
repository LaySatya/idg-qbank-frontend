// ============================================================================
// src/components/questions/constants/questionConstants.js
// ============================================================================
export const GRADE_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: '100%', label: '100%' },
  { value: '90%', label: '90%' },
  { value: '83.33333%', label: '83.33333%' },
  { value: '80%', label: '80%' },
  { value: '75%', label: '75%' },
  { value: '70%', label: '70%' },
  { value: '66.66667%', label: '66.66667%' },
  { value: '60%', label: '60%' },
  { value: '50%', label: '50%' },
  { value: '40%', label: '40%' },
  { value: '33.33333%', label: '33.33333%' },
  { value: '30%', label: '30%' },
  { value: '25%', label: '25%' },
  { value: '20%', label: '20%' },
  { value: '16.66667%', label: '16.66667%' },
  { value: '14.28571%', label: '14.28571%' },
  { value: '12.5%', label: '12.5%' },
  { value: '11.11111%', label: '11.11111%' },
  { value: '10%', label: '10%' },
  { value: '5%', label: '5%' },
  { value: '-5%', label: '-5%' },
  { value: '-10%', label: '-10%' },
  { value: '-11.11111%', label: '-11.11111%' },
  { value: '-12.5%', label: '-12.5%' },
  { value: '-14.28571%', label: '-14.28571%' },
  { value: '-16.66667%', label: '-16.66667%' },
  { value: '-20%', label: '-20%' },
  { value: '-25%', label: '-25%' },
  { value: '-30%', label: '-30%' },
  { value: '-33.33333%', label: '-33.33333%' },
  { value: '-40%', label: '-40%' },
  { value: '-50%', label: '-50%' },
  { value: '-60%', label: '-60%' },
  { value: '-66.66667%', label: '-66.66667%' },
  { value: '-70%', label: '-70%' },
  { value: '-75%', label: '-75%' },
  { value: '-80%', label: '-80%' },
  { value: '-83.33333%', label: '-83.33333%' },
  { value: '-90%', label: '-90%' },
  { value: '-100%', label: '-100%' }
];



export const DEFAULT_CHOICES = [
  { text: '', grade: 'None', feedback: '' },
  { text: '', grade: 'None', feedback: '' },
  { text: '', grade: 'None', feedback: '' },
  { text: '', grade: 'None', feedback: '' },
  { text: '', grade: 'None', feedback: '' }
];

export const DEFAULT_TRUE_FALSE_QUESTION = {
  title: '',
  questionText: '',
  status: 'draft',
  defaultMark: 1,
  idNumber: '',
  generalFeedback: '',
  correctAnswer: 'true',
  showInstructions: false,
  feedbackTrue: '',
  feedbackFalse: '',
  penalty: 0,
  tags: []
};

export const DEFAULT_MULTIPLE_CHOICE_QUESTION = {
  title: '',
  questionText: '',
  qtype: 'multichoice',
  questionStatus: 'Ready',
  defaultMark: 100,
  idNumber: '',
  generalFeedback: '',
  multipleAnswers: false,
  shuffleAnswers: true,
  numberChoices: '1, 2, 3, ...',
  showInstructions: false,
  choices: DEFAULT_CHOICES, // <-- now this works!
  tags: [],
  combinedFeedback: {
    correct: 'Your answer is correct.',
    partiallyCorrect: 'Your answer is partially correct.',
    incorrect: 'Your answer is incorrect.',
    showNumberCorrect: false
  },
  penaltyFactor: 0,
  hint1: '',
  hint1ClearIncorrect: false,
  hint1ShowNumCorrect: false,
  hint2: '',
  hint2ClearIncorrect: false,
  hint2ShowNumCorrect: false
};



export const AVAILABLE_TAGS = [
  // Difficulty
  'easy', 'medium', 'hard',
  // Core IT Subjects
  'programming', 'algorithms', 'data structures', 'databases', 'networking', 'operating systems',
  'web development', 'software engineering', 'security', 'ai', 'machine learning',
  // Languages/Technologies
  'python', 'java', 'c++', 'javascript', 'html', 'css', 'sql',
  // Assessment context
  'quiz', 'exam', 'assignment', 'practice', 'lab', 'project',
  // Status
  'draft', 'review', 'approved', 'archived'
];

// True/False Question Constants

