// import React, { useRef, useEffect, useState } from 'react';

// // Enhanced TextEditor Component
// export const TextEditor = ({ 
//   value, 
//   onChange, 
//   placeholder, 
//   error, 
//   minHeight = "120px" 
// }) => {
//   return (
//     <div className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}>
//       {/* Toolbar matching Moodle's simple style */}
//       <div className="border-b border-gray-200 p-2 flex items-center gap-1 bg-gray-50">
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">↵</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm font-bold">B</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm italic">I</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm underline">U</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">A</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">🔤</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">⋯</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">🔗</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">🖼️</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">🎥</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">📁</button>
//         <button type="button" className="p-1 hover:bg-gray-200 rounded text-sm">
//           <img src="src/assets/icon_text/H5p.svg" className="w-6 h-6" alt="H5P" />
//         </button>
//       </div>
//       <textarea
//         className={`
//           w-full px-3 py-2 border-0 rounded-b-md 
//           focus:outline-none focus:ring-2 focus:ring-blue-500
//           ${error ? 'border-red-500' : ''}
//         `}
//         style={{ minHeight }}
//         value={value}
//         onChange={e => onChange(e.target.value)}
//         placeholder={placeholder}
//       />
//     </div>
//   );
// };

// // Enhanced TagDropdown Component
// export const TagDropdown = ({ 
//   tags, 
//   onTagToggle, 
//   isOpen, 
//   onToggle, 
//   error, 
//   availableTags 
// }) => {
//   const dropdownRef = useRef();
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     if (!isOpen) return;
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         onToggle(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isOpen, onToggle]);

//   const filteredTags = availableTags.filter(tag =>
//     tag.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <div
//         onClick={() => onToggle(true)}
//         className={`
//           w-full px-3 py-2 border 
//           ${error ? 'border-red-500' : 'border-gray-300'} 
//           rounded-md cursor-pointer bg-white 
//           flex items-center justify-between min-h-[42px]
//         `}
//       >
//         <div className="flex flex-wrap gap-1">
//           {tags.length > 0 ? (
//             tags.map(tag => (
//               <span 
//                 key={tag} 
//                 className="
//                   inline-flex items-center px-2 py-1 
//                   rounded-full text-xs font-medium 
//                   bg-blue-100 text-blue-800
//                 "
//               >
//                 {tag}
//                 <button
//                   type="button"
//                   onClick={e => { e.stopPropagation(); onTagToggle(tag); }}
//                   className="ml-1 text-blue-600 hover:text-blue-800"
//                 >
//                   ×
//                 </button>
//               </span>
//             ))
//           ) : (
//             <span className="text-gray-500">Select tags...</span>
//           )}
//         </div>
//         <span className="ml-2">▼</span>
//       </div>
//       {isOpen && (
//         <div className="
//           absolute z-10 w-full mt-1 
//           bg-white border border-gray-300 
//           rounded-md shadow-lg 
//           max-h-48 overflow-y-auto
//         ">
//           <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
//             <input
//               type="text"
//               placeholder="Search tags..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="
//                 w-full px-3 py-2 
//                 border border-gray-300 rounded-md 
//                 text-sm focus:ring-2 focus:ring-blue-500 
//                 focus:border-blue-500
//               "
//             />
//           </div>
//           {availableTags.map(tag => (
//             <div
//               key={tag}
//               onClick={() => onTagToggle(tag)}
//               className={`
//                 px-3 py-2 cursor-pointer 
//                 hover:bg-gray-100 
//                 flex items-center justify-between 
//                 ${tags.includes(tag) ? 'bg-blue-50 text-blue-700' : ''}
//               `}
//             >
//               <span>{tag}</span>
//               {tags.includes(tag) && <span className="text-blue-600">✓</span>}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// // Form Field Component
// export const FormField = ({ 
//   label, 
//   required = false, 
//   error, 
//   children, 
//   className = "space-y-2",
//   description
// }) => (
//   <div className={className}>
//     {label && (
//       <label className="block text-sm font-medium text-gray-900">
//         {label} 
//         {required && <span className="text-red-500 ml-1">*</span>}
//       </label>
//     )}
//     {description && (
//       <p className="text-sm text-gray-600">{description}</p>
//     )}
//     {children}
//     {error && (
//       <p className="text-sm text-red-600 flex items-center">
//         <span className="mr-1">⚠</span>
//         {error}
//       </p>
//     )}
//   </div>
// );

// // Number Input Component
// export const NumberInput = ({ 
//   value, 
//   onChange, 
//   min = 0, 
//   max, 
//   step = 0.1, 
//   className = "w-32", 
//   error,
//   placeholder = "0"
// }) => (
//   <input
//     type="number"
//     value={value}
//     onChange={e => onChange(Number(e.target.value))}
//     min={min}
//     max={max}
//     step={step}
//     placeholder={placeholder}
//     className={`
//       ${className} px-3 py-2 
//       border rounded-md 
//       focus:ring-2 focus:ring-blue-500 
//       focus:border-blue-500 
//       ${error ? 'border-red-500' : 'border-gray-300'}
//     `}
//   />
// );

// // Radio Group Component
// export const RadioGroup = ({ 
//   name, 
//   value, 
//   onChange, 
//   options, 
//   className = "flex items-center space-x-6" 
// }) => (
//   <div className={className}>
//     {options.map(option => (
//       <label 
//         key={option.value} 
//         className="inline-flex items-center cursor-pointer"
//       >
//         <input
//           type="radio"
//           name={name}
//           value={option.value}
//           checked={value === option.value}
//           onChange={e => onChange(e.target.value)}
//           className="
//             h-4 w-4 text-blue-600 
//             focus:ring-blue-500 border-gray-300
//           "
//         />
//         <span className="ml-3 text-sm font-medium text-gray-900">
//           {option.label}
//         </span>
//       </label>
//     ))}
//   </div>
// );

// // Validation Errors Component
// export const ValidationErrors = ({ errors }) => {
//   if (!errors || Object.keys(errors).length === 0) return null;

//   return (
//     <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//       <div className="flex items-center mb-2">
//         <span className="text-red-600 mr-2">⚠</span>
//         <h4 className="text-red-800 font-medium">Please fix the following errors:</h4>
//       </div>
//       <ul className="list-disc list-inside text-red-700 space-y-1">
//         {Object.values(errors).map((msg, i) =>
//           Array.isArray(msg)
//             ? msg.map((m, j) => m && <li key={`${i}-${j}`}>{m}</li>)
//             : <li key={i}>{msg}</li>
//         )}
//       </ul>
//     </div>
//   );
// };