/**
 * Form Validation Utilities
 * Handles validation logic separated from component
 */

/**
 * Checks if a question has at least one ranked option
 * @param {Object} qData - Response data for a question (e.g., {0: "1", 1: "2"})
 * @returns {boolean} True if any option has a rank
 */
export function hasAnyRank(qData) {
  return qData && Object.values(qData).some((rank) => rank && rank !== "");
}

/**
 * Validates all form responses
 * @param {Array} questions - Array of question objects
 * @param {Object} responses - Form responses object
 * @param {string} finalComment - Final comments text
 * @returns {Object} { isValid: boolean, errors: Array<{type, qId?, message}> }
 */
export function validateForm(questions, responses, finalComment) {
  const errors = [];

  // Validate each question
  questions.forEach((q, idx) => {
    const qData = responses[q.id];
    if (!hasAnyRank(qData)) {
      errors.push({
        type: "question",
        qId: q.id,
        qIdx: idx,
        message: `Question ${idx + 1}: ${q.text.substring(0, 50)}...`,
      });
    }
  });

  // Validate final comments
  if (!finalComment || !finalComment.trim()) {
    errors.push({
      type: "final-comment",
      message: "Final Comments: Please share your recommendations",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the first unanswered question element ID
 * @param {Array} errors - Validation errors array
 * @returns {string|null} Element ID of first unanswered question
 */
export function getFirstUnansweredElementId(errors) {
  const questionError = errors.find((e) => e.type === "question");
  if (questionError) {
    return `question-${questionError.qId}`;
  }

  const commentError = errors.find((e) => e.type === "final-comment");
  if (commentError) {
    return "final-comments";
  }

  return null;
}

/**
 * Scroll to element for accessibility
 * @param {string|null} elementId - Element ID to scroll to
 */
export function scrollToFirstError(elementId) {
  if (!elementId) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
