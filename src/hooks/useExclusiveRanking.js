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
   * Numeric ranks (1-5) are exclusive: only one option per rank per question
   * "No" is non-exclusive: multiple options can be marked as "No"
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

      const updatedQData = { ...newResponses[qId] };

      // "No" is non-exclusive - allow multiple options to be marked as "No"
      // Only enforce exclusivity for numeric ranks (1-5)
      if (rank !== "No") {
        // For numeric ranks, remove that rank from other options in this question
        Object.keys(updatedQData).forEach((key) => {
          const keyNum = parseInt(key);
          // If different option has the same numeric rank, clear it
          if (keyNum !== optIdx && updatedQData[key] === rank) {
            updatedQData[key] = "";
          }
        });
      }

      // Set the new rank
      updatedQData[optIdx] = rank;
      newResponses[qId] = updatedQData;

      return newResponses;
    });
  }, []);

  return { responses, updateRank };
}
