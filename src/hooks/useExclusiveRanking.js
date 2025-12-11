import { useState, useCallback } from "react";

/**
 * Custom hook for managing exclusive ranking state
 * Ensures each rank value (1-5, No) can only be assigned to one option per question
 * 
 * @returns {Object} { responses, updateRank }
 */
export function useExclusiveRanking() {
  const [responses, setResponses] = useState({});

  /**
   * Update rank for an option with exclusive constraint
   * If a rank is assigned to an option, it's automatically removed from other options
   * 
   * @param {string} qId - Question ID (e.g., 'q1')
   * @param {number} optIdx - Option index
   * @param {string} rank - Rank value (e.g., '1', '2', 'No') or empty string to clear
   */
  const updateRank = useCallback((qId, optIdx, rank) => {
    setResponses((prevResponses) => {
      const newResponses = { ...prevResponses };
      if (!newResponses[qId]) {
        newResponses[qId] = {};
      }

      // If unchecking (empty rank), just clear it
      if (rank === "") {
        newResponses[qId] = {
          ...newResponses[qId],
          [optIdx]: "",
        };
        return newResponses;
      }

      // If setting a rank, remove that rank from other options in this question
      const updatedQData = { ...newResponses[qId] };
      Object.keys(updatedQData).forEach((key) => {
        const keyNum = parseInt(key);
        // If different option has the same rank, clear it
        if (keyNum !== optIdx && updatedQData[key] === rank) {
          updatedQData[key] = "";
        }
      });

      // Set the new rank
      updatedQData[optIdx] = rank;
      newResponses[qId] = updatedQData;

      return newResponses;
    });
  }, []);

  return { responses, updateRank };
}
