// ============================================================================
// src/hooks/useDropdowns.js - Clean Dropdown Management Hook
// ============================================================================
import { useState, useRef, useEffect } from 'react';

export const useDropdowns = () => {
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [showQuestionsDropdown, setShowQuestionsDropdown] = useState(false);
  const dropdownRefs = useRef({});
  const questionsDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openActionDropdown &&
        dropdownRefs.current[openActionDropdown] &&
        !dropdownRefs.current[openActionDropdown].contains(event.target)
      ) {
        setOpenActionDropdown(null);
      }
      if (
        openStatusDropdown &&
        dropdownRefs.current[openStatusDropdown] &&
        !dropdownRefs.current[openStatusDropdown].contains(event.target)
      ) {
        setOpenStatusDropdown(null);
      }
      if (
        showQuestionsDropdown &&
        questionsDropdownRef.current &&
        !questionsDropdownRef.current.contains(event.target)
      ) {
        setShowQuestionsDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionDropdown, openStatusDropdown, showQuestionsDropdown]);

  return {
    openActionDropdown,
    setOpenActionDropdown,
    openStatusDropdown,
    setOpenStatusDropdown,
    showQuestionsDropdown,
    setShowQuestionsDropdown,
    dropdownRefs,
    questionsDropdownRef
  };
};
