// Color helpers and other utility functions
export const getTypeColor = (type) => {
  switch (type) {
    case 'Multiple Choice': return 'bg-blue-100 text-blue-800';
    case 'Multiple Select (Choose Two)': return 'bg-indigo-100 text-indigo-800';
    case 'Multiple Select (Choose Three)': return 'bg-indigo-100 text-indigo-800';
    case 'Multiple Select': return 'bg-indigo-100 text-indigo-800';
    case 'True/False': return 'bg-green-100 text-green-800';
    case 'Short Answer': return 'bg-purple-100 text-purple-800';
    case 'Essay': return 'bg-yellow-100 text-yellow-800';
    case 'Fill in the Blank': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Easy': return 'text-green-600';
    case 'Medium': return 'text-amber-600';
    case 'Hard': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const exportToXML = (questions) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n';
  
  questions.forEach(question => {
    xml += `  <question type="${question.type.toLowerCase().replace(/\s+/g, '')}">\n`;
    xml += `    <n><text>${question.questiontext.substring(0, 50)}...</text></n>\n`;
    xml += `    <questiontext format="html"><text>${question.questiontext}</text></questiontext>\n`;
    
    if (question.options) {
      question.options.forEach(option => {
        const isCorrect = question.correctAnswer === option ? 100 : 0;
        xml += `    <answer fraction="${isCorrect}" format="html">\n`;
        xml += `      <text>${option}</text>\n`;
        xml += `    </answer>\n`;
      });
    }
    
    xml += `  </question>\n`;
  });
  
  xml += '</quiz>';
  
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `questions_export_${new Date().toISOString().split('T')[0]}.xml`;
  a.click();
  URL.revokeObjectURL(url);
};