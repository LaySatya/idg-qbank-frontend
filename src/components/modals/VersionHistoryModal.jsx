// import React from 'react';
// import { X } from 'lucide-react';

// const VersionHistoryModal = ({ question, onClose }) => {
//   if (!question) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">Version History</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             <X size={24} />
//           </button>
//         </div>

//         <div className="space-y-4">
//           {question.versions.map((version, index) => (
//             <div 
//               key={version.id} 
//               className="border-b pb-4 last:border-b-0"
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <span className="font-semibold">Version {index + 1}</span>
//                 <span className="text-sm text-gray-500">{version.date}</span>
//               </div>
//               <div className="text-sm">
//                 <p><strong>Author:</strong> {version.author}</p>
//                 <p><strong>Changes:</strong> {version.changes}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VersionHistoryModal;