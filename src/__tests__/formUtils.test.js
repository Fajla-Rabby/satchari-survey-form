/**
 * Unit Tests for Form Utilities
 * Run with: npm test
 * @jest-environment jsdom
 */

/* eslint-disable no-undef */
// Tests use Jest globals: describe, it, expect

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

import {
  hasAnyRank,
  validateForm,
  getFirstUnansweredElementId,
} from "../utils/formValidation";

describe("formValidation", () => {
  describe("hasAnyRank", () => {
    it("should return false for undefined qData", () => {
      expect(hasAnyRank(undefined)).toBe(false);
    });

    it("should return false for empty object", () => {
      expect(hasAnyRank({})).toBe(false);
    });

    it("should return false when all ranks are empty strings", () => {
      expect(hasAnyRank({ 0: "", 1: "", 2: "" })).toBe(false);
    });

    it("should return true when at least one rank exists", () => {
      expect(hasAnyRank({ 0: "1", 1: "", 2: "" })).toBe(true);
    });

    it("should return true for rank 'No'", () => {
      expect(hasAnyRank({ 0: "No" })).toBe(true);
    });

    it("should ignore falsy values except empty string", () => {
      expect(hasAnyRank({ 0: "0", 1: undefined })).toBe(true);
    });
  });

  describe("validateForm", () => {
    const mockQuestions = [
      {
        id: "q1",
        text: "What is your favorite color?",
        options: ["Red", "Blue"],
      },
      {
        id: "q2",
        text: "What is your favorite animal?",
        options: ["Cat", "Dog"],
      },
    ];

    it("should return valid when all questions answered and comment provided", () => {
      const responses = {
        q1: { 0: "1" },
        q2: { 0: "2" },
      };
      const finalComment = "Great form!";

      const result = validateForm(mockQuestions, responses, finalComment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should identify unanswered question", () => {
      const responses = {
        q1: { 0: "1" },
        // q2 is missing
      };
      const finalComment = "Great form!";

      const result = validateForm(mockQuestions, responses, finalComment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("question");
      expect(result.errors[0].qId).toBe("q2");
      expect(result.errors[0].message).toContain("Question 2");
    });

    it("should identify missing final comment", () => {
      const responses = {
        q1: { 0: "1" },
        q2: { 0: "2" },
      };
      const finalComment = "";

      const result = validateForm(mockQuestions, responses, finalComment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("final-comment");
    });

    it("should identify both unanswered questions and missing comment", () => {
      const responses = {
        q1: { 0: "1" },
        // q2 is missing
      };
      const finalComment = ""; // missing

      const result = validateForm(mockQuestions, responses, finalComment);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some((e) => e.type === "question")).toBe(true);
      expect(result.errors.some((e) => e.type === "final-comment")).toBe(true);
    });

    it("should handle whitespace-only final comment as invalid", () => {
      const responses = {
        q1: { 0: "1" },
        q2: { 0: "2" },
      };
      const finalComment = "   \n\t  ";

      const result = validateForm(mockQuestions, responses, finalComment);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("final-comment");
    });
  });

  describe("getFirstUnansweredElementId", () => {
    it("should return question element ID for question error", () => {
      const errors = [{ type: "question", qId: "q2", message: "..." }];
      expect(getFirstUnansweredElementId(errors)).toBe("question-q2");
    });

    it("should return final-comments element ID when no question errors", () => {
      const errors = [{ type: "final-comment", message: "..." }];
      expect(getFirstUnansweredElementId(errors)).toBe("final-comments");
    });

    it("should prioritize question error over final comment", () => {
      const errors = [
        { type: "final-comment", message: "..." },
        { type: "question", qId: "q1", message: "..." },
      ];
      expect(getFirstUnansweredElementId(errors)).toBe("question-q1");
    });

    it("should return null for empty errors", () => {
      expect(getFirstUnansweredElementId([])).toBe(null);
    });
  });
});

// ============================================================================
// RANKING LOGIC TESTS
// ============================================================================

// Note: useExclusiveRanking is a React hook and requires React Testing Library
// These are integration-style tests that verify the logic

describe("Exclusive Ranking Logic", () => {
  /**
   * Simulates the exclusive ranking logic
   * (extracted from useExclusiveRanking hook for testing)
   */
  function updateResponseWithExclusiveRank(prevResponses, qId, optIdx, rank) {
    const newResponses = { ...prevResponses };
    if (!newResponses[qId]) {
      newResponses[qId] = {};
    }

    if (rank === "") {
      newResponses[qId] = {
        ...newResponses[qId],
        [optIdx]: "",
      };
      return newResponses;
    }

    const updatedQData = { ...newResponses[qId] };
    Object.keys(updatedQData).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum !== optIdx && updatedQData[key] === rank) {
        updatedQData[key] = "";
      }
    });

    updatedQData[optIdx] = rank;
    newResponses[qId] = updatedQData;

    return newResponses;
  }

  it("should assign rank to option when none exists", () => {
    const initial = {};
    const result = updateResponseWithExclusiveRank(initial, "q1", 0, "1");

    expect(result.q1[0]).toBe("1");
  });

  it("should remove rank from other options when assigning same rank", () => {
    const initial = { q1: { 0: "1", 1: "1" } };
    const result = updateResponseWithExclusiveRank(initial, "q1", 1, "1");

    expect(result.q1[0]).toBe(""); // removed from first option
    expect(result.q1[1]).toBe("1"); // kept on second option
  });

  it("should allow different ranks on different options", () => {
    const initial = { q1: { 0: "1" } };
    const result = updateResponseWithExclusiveRank(initial, "q1", 1, "2");

    expect(result.q1[0]).toBe("1");
    expect(result.q1[1]).toBe("2");
  });

  it("should clear rank when unchecking option", () => {
    const initial = { q1: { 0: "1", 1: "2" } };
    const result = updateResponseWithExclusiveRank(initial, "q1", 0, "");

    expect(result.q1[0]).toBe("");
    expect(result.q1[1]).toBe("2"); // unchanged
  });

  it("should handle multiple questions independently", () => {
    const initial = { q1: { 0: "1" } };
    const result = updateResponseWithExclusiveRank(initial, "q2", 0, "1");

    expect(result.q1[0]).toBe("1"); // unchanged
    expect(result.q2[0]).toBe("1");
  });

  it("should support 'No' as a valid rank value", () => {
    const initial = { q1: { 0: "1" } };
    const result = updateResponseWithExclusiveRank(initial, "q1", 1, "No");

    expect(result.q1[0]).toBe("1");
    expect(result.q1[1]).toBe("No");
  });

  it("should handle rank switching on same option", () => {
    const initial = { q1: { 0: "1" } };
    let result = updateResponseWithExclusiveRank(initial, "q1", 0, "2");

    expect(result.q1[0]).toBe("2");

    result = updateResponseWithExclusiveRank(result, "q1", 0, "3");
    expect(result.q1[0]).toBe("3");
  });
});

// ============================================================================
// INPUT SANITIZATION TESTS
// ============================================================================

import {
  sanitizeTextInput,
  sanitizeCommentInput,
  isTextEmpty,
  isTextLengthValid,
} from "../utils/sanitization";

describe("Input Sanitization", () => {
  describe("sanitizeTextInput", () => {
    it("should trim whitespace", () => {
      expect(sanitizeTextInput("  hello  ")).toBe("hello");
    });

    it("should remove script tags", () => {
      expect(sanitizeTextInput("<script>alert('xss')</script>")).toBe(
        "alert('xss')"
      );
    });

    it("should remove javascript protocol", () => {
      expect(sanitizeTextInput("javascript:alert('xss')")).toBe(
        "alert('xss')"
      );
    });

    it("should remove onerror attributes", () => {
      expect(sanitizeTextInput('<img onerror="alert(\'xss\')">')).toBe(
        '<img >'
      );
    });

    it("should enforce max length", () => {
      const longText = "a".repeat(10000);
      const result = sanitizeTextInput(longText);
      expect(result.length).toBeLessThanOrEqual(5000);
    });

    it("should return empty string for null/undefined", () => {
      expect(sanitizeTextInput(null)).toBe("");
      expect(sanitizeTextInput(undefined)).toBe("");
    });

    it("should handle normal text", () => {
      const text = "This is normal text with spaces and punctuation!";
      expect(sanitizeTextInput(text)).toBe(text);
    });
  });

  describe("sanitizeCommentInput", () => {
    it("should allow longer comments", () => {
      const longComment = "a".repeat(8000);
      const result = sanitizeCommentInput(longComment);
      expect(result.length).toBe(8000);
    });

    it("should still sanitize dangerous content", () => {
      const dangerous = "<script>" + "a".repeat(8000);
      const result = sanitizeCommentInput(dangerous);
      expect(result).not.toContain("<script>");
    });
  });

  describe("isTextEmpty", () => {
    it("should return true for empty string", () => {
      expect(isTextEmpty("")).toBe(true);
    });

    it("should return true for whitespace only", () => {
      expect(isTextEmpty("   \n\t  ")).toBe(true);
    });

    it("should return true for null/undefined", () => {
      expect(isTextEmpty(null)).toBe(true);
      expect(isTextEmpty(undefined)).toBe(true);
    });

    it("should return false for text with content", () => {
      expect(isTextEmpty("Hello")).toBe(false);
      expect(isTextEmpty("  Hello  ")).toBe(false);
    });
  });

  describe("isTextLengthValid", () => {
    it("should validate minimum length", () => {
      expect(isTextLengthValid("hi", 2, 10)).toBe(true);
      expect(isTextLengthValid("h", 2, 10)).toBe(false);
    });

    it("should validate maximum length", () => {
      expect(isTextLengthValid("hello", 0, 5)).toBe(true);
      expect(isTextLengthValid("hello!", 0, 5)).toBe(false);
    });

    it("should trim whitespace before checking length", () => {
      expect(isTextLengthValid("  hello  ", 5, 5)).toBe(true);
    });

    it("should handle null/undefined", () => {
      expect(isTextLengthValid(null, 0, 10)).toBe(true);
      expect(isTextLengthValid(null, 1, 10)).toBe(false);
    });
  });
});

// ============================================================================
// FORM SUBMISSION SERVICE TESTS
// ============================================================================

import {
  normalizeFormData,
  getErrorMessage,
} from "../services/formSubmissionService";

describe("Form Submission Service", () => {
  const mockQuestions = [
    {
      id: "q1",
      text: "Question 1",
      options: ["Option A", "Option B", "Option C"],
    },
    {
      id: "q2",
      text: "Question 2",
      options: ["Option X", "Option Y"],
    },
  ];

  describe("normalizeFormData", () => {
    it("should fill missing values with 'No'", () => {
      const responses = {
        q1: { 0: "1" }, // only first option ranked
      };
      const data = normalizeFormData(
        mockQuestions,
        responses,
        {},
        "Great form!"
      );

      expect(data.responses.q1[0]).toBe("1");
      expect(data.responses.q1[1]).toBe("No");
      expect(data.responses.q1[2]).toBe("No");
    });

    it("should handle completely empty question", () => {
      const responses = {};
      const data = normalizeFormData(
        mockQuestions,
        responses,
        {},
        "Great form!"
      );

      expect(data.responses.q1[0]).toBe("No");
      expect(data.responses.q1[1]).toBe("No");
      expect(data.responses.q1[2]).toBe("No");
      expect(data.responses.q2[0]).toBe("No");
      expect(data.responses.q2[1]).toBe("No");
    });

    it("should include timestamp in ISO format", () => {
      const data = normalizeFormData(mockQuestions, {}, {}, "Comment");
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it("should include otherText and finalComment", () => {
      const otherText = { q1: "Custom response" };
      const finalComment = "This is my final comment";

      const data = normalizeFormData(
        mockQuestions,
        {},
        otherText,
        finalComment
      );

      expect(data.otherText).toEqual(otherText);
      expect(data.finalComment).toBe(finalComment);
    });

    it("should preserve all ranked values", () => {
      const responses = {
        q1: { 0: "1", 1: "2", 2: "3" },
        q2: { 0: "4", 1: "5" },
      };

      const data = normalizeFormData(
        mockQuestions,
        responses,
        {},
        "Comment"
      );

      expect(data.responses.q1).toEqual({ 0: "1", 1: "2", 2: "3" });
      expect(data.responses.q2).toEqual({ 0: "4", 1: "5" });
    });
  });

  describe("getErrorMessage", () => {
    it("should provide helpful message for timeout error", () => {
      const error = new Error("Request timeout after 5000ms");
      const msg = getErrorMessage(error);
      expect(msg).toContain("server took too long");
    });

    it("should provide helpful message for network error", () => {
      const error = new Error("Network error - unable to reach server");
      const msg = getErrorMessage(error);
      expect(msg).toContain("internet connection");
    });

    it("should provide config error message", () => {
      const error = new Error("Google Apps Script URL is not configured");
      const msg = getErrorMessage(error);
      expect(msg).toContain("not properly configured");
    });

    it("should provide generic error message for unknown error", () => {
      const error = new Error("Some weird error");
      const msg = getErrorMessage(error);
      expect(msg).toContain("error occurred");
    });
  });
});
