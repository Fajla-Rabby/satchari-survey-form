/**
 * Input Sanitization Utilities
 * Prevents XSS attacks and validates user input
 */

// Maximum allowed text input length
const MAX_TEXT_LENGTH = 5000;
const MAX_COMMENT_LENGTH = 10000;

/**
 * Sanitize general text input
 * Removes potentially dangerous patterns and enforces length limits
 * 
 * @param {string} text - Input text to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @returns {string} Sanitized text
 */
export function sanitizeTextInput(text, maxLength = MAX_TEXT_LENGTH) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .slice(0, maxLength)
    .replace(/<script|<iframe|javascript:|onerror=/gi, ""); // Remove dangerous patterns
}

/**
 * Sanitize longer form input (comments)
 * Similar to sanitizeTextInput but with higher length limit
 * 
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeCommentInput(text) {
  return sanitizeTextInput(text, MAX_COMMENT_LENGTH);
}

/**
 * Validate text is not empty (after trim)
 * 
 * @param {string} text - Text to validate
 * @returns {boolean} True if text is not empty
 */
export function isTextEmpty(text) {
  return !text || text.trim().length === 0;
}

/**
 * Validate text length
 * 
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length (inclusive)
 * @param {number} maxLength - Maximum length (inclusive)
 * @returns {boolean} True if text length is within range
 */
export function isTextLengthValid(text, minLength = 0, maxLength = MAX_TEXT_LENGTH) {
  if (!text || typeof text !== "string") {
    return minLength === 0;
  }

  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}
