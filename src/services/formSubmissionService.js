/**
 * Form Submission Service
 * Handles API calls with retry logic, timeout, and error handling
 */

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Delay helper for retry backoff
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normalize form data for submission
 * Ensures all options have a value (defaults to "No" if unselected)
 * 
 * @param {Array} questions - Array of question objects
 * @param {Object} responses - Form responses
 * @param {Object} otherText - Other text responses
 * @param {string} finalComment - Final comments
 * @returns {Object} Normalized data ready for submission
 */
export function normalizeFormData(questions, responses, otherText, finalComment) {
  const normalizedResponses = {};

  questions.forEach((q) => {
    const qId = q.id;
    const numOptions = q.options.length;
    const qData = responses[qId] || {};
    const entry = {};

    for (let i = 0; i < numOptions; i++) {
      entry[i] = qData[i] || "No";
    }

    normalizedResponses[qId] = entry;
  });

  return {
    timestamp: new Date().toISOString(),
    responses: normalizedResponses,
    otherText,
    finalComment,
  };
}

/**
 * Submit form with retry logic and timeout
 * 
 * @param {Object} data - Form data to submit
 * @param {string} scriptUrl - Google Apps Script deployment URL
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Max number of retries (default: 3)
 * @param {number} options.timeout - Request timeout in ms (default: 5000)
 * @param {number} options.initialRetryDelay - Initial delay before first retry in ms (default: 1000)
 * @param {Function} options.onRetry - Callback on retry attempt
 * @returns {Promise<{success: boolean, error?: Error}>}
 * 
 * @example
 * const result = await submitForm(data, scriptUrl, {
 *   maxRetries: 3,
 *   timeout: 5000,
 *   onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 * });
 */
export async function submitForm(data, scriptUrl, options = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT_MS,
    initialRetryDelay = DEFAULT_INITIAL_RETRY_DELAY_MS,
    onRetry = null,
  } = options;

  if (!scriptUrl) {
    throw new Error("Google Apps Script URL is not configured");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // In no-cors mode, we can't check response.ok, but we can check status
      // Success is indicated by no exception being thrown
      console.log(`Form submitted successfully (attempt ${attempt})`);
      return { success: true };
    } catch (error) {
      clearTimeout(undefined);
      lastError = error;

      // Determine error type
      let errorMessage = error.message;
      if (error.name === "AbortError") {
        errorMessage = `Request timeout after ${timeout}ms`;
      } else if (error instanceof TypeError) {
        errorMessage = "Network error - unable to reach server";
      }

      const isLastAttempt = attempt === maxRetries;

      if (!isLastAttempt) {
        const delayMs = initialRetryDelay * attempt; // exponential backoff
        if (onRetry) {
          onRetry(attempt, new Error(errorMessage), delayMs);
        }
        await delay(delayMs);
      } else {
        if (onRetry) {
          onRetry(attempt, new Error(errorMessage), 0);
        }
      }
    }
  }

  // All retries failed
  throw new Error(
    `Form submission failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Get user-friendly error message based on error type
 * 
 * @param {Error} error - Error object from submitForm
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  const message = error.message || "";

  if (message.includes("timeout")) {
    return "The server took too long to respond. Please check your connection and try again.";
  }

  if (message.includes("Network error")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (message.includes("not configured")) {
    return "Form is not properly configured. Please contact support.";
  }

  return "An error occurred while submitting your response. Please try again.";
}
