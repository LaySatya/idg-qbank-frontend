// hooks/useFilters.js - Corrected version for API integration
import { useState, useMemo } from 'react';

export const useFilters = (questions) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    type: 'All'
  });

  // Extract all unique tags from questions for the dropdown
  const allTags = useMemo(() => {
    const tags = new Set();
    
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tags.add(tag.toLowerCase().trim());
          }
        });
      }
    });
    
    return Array.from(tags).sort();
  }, [questions]);

  //  CRITICAL FIX: No client-side filtering when using API filtering
  // The API already returns filtered results, so we just pass through the questions
  // This prevents double-filtering and ensures API results are displayed correctly
  const filteredQuestions = questions;

  console.log(' useFilters hook state:', {
    searchQuery,
    filters,
    tagFilter,
    totalQuestions: questions.length,
    filteredQuestions: filteredQuestions.length,
    allTags: allTags.length
  });

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    tagFilter,
    setTagFilter,
    filteredQuestions, // This now just returns the API-filtered questions
    allTags
  };
};