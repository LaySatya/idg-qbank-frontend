// hooks/usePagination.js
import { useState, useMemo, useEffect } from 'react';

export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(itemsPerPage);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    if (!Array.isArray(items)) {
      return {
        paginatedQuestions: [],
        startIdx: 0,
        endIdx: 0,
        totalPages: 1
      };
    }

    const startIdx = (currentPage - 1) * questionsPerPage;
    const endIdx = startIdx + questionsPerPage;
    const paginatedQuestions = items.slice(startIdx, endIdx);
    const totalPages = Math.ceil(items.length / questionsPerPage) || 1;
    
    return {
      paginatedQuestions,
      startIdx,
      endIdx,
      totalPages
    };
  }, [items, currentPage, questionsPerPage]);

  // Reset to page 1 when items change (e.g., after filtering)
  useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, paginationData.totalPages, currentPage]);

  // Reset to page 1 when changing items per page
  const handleSetQuestionsPerPage = (newItemsPerPage) => {
    setQuestionsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    questionsPerPage,
    setQuestionsPerPage: handleSetQuestionsPerPage,
    paginatedQuestions: paginationData.paginatedQuestions,
    startIdx: paginationData.startIdx,
    endIdx: paginationData.endIdx,
    totalPages: paginationData.totalPages
  };
};