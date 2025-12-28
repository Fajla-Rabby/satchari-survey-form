import { useState } from "react";
import { useExclusiveRanking } from "./hooks/useExclusiveRanking";
import {
  validateForm,
  scrollToFirstError,
  getFirstUnansweredElementId,
} from "./utils/formValidation";
import {
  submitForm,
  normalizeFormData,
  getErrorMessage,
} from "./services/formSubmissionService";
import { sanitizeCommentInput, sanitizeTextInput } from "./utils/sanitization";

const questions = [
  {
    id: "q1",
    section: "Section 1: Strengthening Current Ecotourism Management",
    text: "What types of ecotourism infrastructure should be prioritized immediately in Satchari National Park to improve visitor management and minimize ecological disturbance?",
    options: [
      "Clearly marked walking trails with rest points that avoid core zones and reduce off-trail trampling.",
      "Eco-designed visitor or interpretation center near the entrance showcasing local wildlife, ongoing research, and community contributions in conservation.",
      "Environment-friendly signage and safety boards providing directions, conservation messages, and wildlife etiquette.",
      "Waste-management and sanitation facilities such as segregated bins, composting stations, and eco-toilets.",
      "Visitor monitoring and digital ticketing system with regular patrols to verify entry, prevent unwanted incidents, and assist self-guided tourists.",
    ],
  },
  {
    id: "q2",
    text: "If tourism remains unregulated or poorly managed in Satchari NP, what immediate impacts are most likely to occur?",
    options: [
      "Increased disturbance to wildlife from noise, flashlights, and uncontrolled crowding.",
      "Habitat degradation through littering, trampling, or creation of unauthorized trails.",
      "Decline in visitor satisfaction due to degraded forest experience and overcrowding.",
      "Reduced trust between local communities and park authorities if promised benefits are not realized.",
      "Misallocation of tourism revenue, limiting reinvestment in conservation and community programs.",
    ],
  },
  {
    id: "q3",
    text: "If ecotourism at Satchari NP becomes ineffective or unsustainable, what long-term consequences are most likely?",
    options: [
      "Gradual loss of sensitive forest dependent wildlife populations due to persistent disturbance and habitat degradation.",
      "Weakening of community participation and trust in conservation programs.",
      "Decline in the park's reputation as a nature-based tourism destination, affecting visitor numbers and local income.",
      "Increased pressure on forest resources (e.g., hunting, fuelwood collection) as alternative livelihoods fail.",
      "Reduced funding and research presence for long-term biodiversity monitoring and management.",
    ],
  },
  {
    id: "q4",
    text: "Who should be directly involved in implementing and maintaining immediate ecotourism improvements in Satchari NP?",
    options: [
      "Forest Department and co-management committee members overseeing daily operations.",
      "Local guides, eco-volunteers, and trained youth groups engaged in visitor management.",
      "Academic or research institutions providing technical guidance and ecological monitoring.",
      "NGOs assisting in training, interpretation, and waste-management systems.",
      "Joint operational teams combining park staff, researchers, and local representatives.",
    ],
  },
  {
    id: "q5",
    section:
      "Section 2: Visitor Education and Interpretation",
    text: "What key messages should visitors to Satchari NP learn to enhance understanding and support for conservation?",
    options: [
      "The ecological importance of mixed evergreen forests for sustaining diverse wildlife animals and plants.",
      "The role of Satchari NP as a biodiversity refuge within a landscape dominated by tea estates and settlements.",
      "How responsible visitor behavior (noise control, waste disposal, respectful observation) directly supports wildlife well-being.",
      "The contributions of local communities and co-management initiatives in protecting the park's biodiversity.",
      "The importance of ongoing research and monitoring to guide adaptive, evidence-based management.",
    ],
  },
  {
    id: "q6",
    text: "Which methods could be most effective for communicating these conservation messages to visitors in Satchari NP?",
    options: [
      "Guided nature walks or interpretive tours led by trained local guides.",
      "Informative panels, trail markers, and interpretive signboards along major paths and viewing points.",
      "A small visitor center or exhibition space highlighting forest ecology, local culture, and current research.",
      "Interactive digital tools such as QR-coded signboards, mobile applications, or short videos on conservation efforts.",
      "Hands-on participation in citizen-science or wildlife monitoring programs (e.g., bird, primate or butterfly surveys, plant identification).",
    ],
  },
  {
    id: "q7",
    section: "Section 3: Community Integration and Benefit-Sharing",
    text: "In what ways could local communities be more effectively involved in ecotourism at Satchari NP?",
    options: [
      "Guiding and wildlife interpretation for tourists on designated trails.",
      "Managing community-run homestays, food stalls, or handicraft outlets promoting local culture.",
      "Participating in habitat restoration, tree planting, and maintenance of trails and visitor facilities.",
      "Contributing to biodiversity monitoring and citizen-science programs.",
      "Taking part in decision-making through co-management committees or tourism planning groups.",
    ],
  },
  {
    id: "q8",
    text: "What forms of benefit-sharing from ecotourism would be most acceptable and sustainable for local communities?",
    options: [
      "Direct employment and fair wages for local residents in guiding, hospitality, and park services.",
      "Reinvestment of a portion of visitor fees into community development (e.g., schools, water supply, healthcare).",
      "Support for community-managed enterprises such as eco-cafes, craft centers, or homestays.",
      "Training and capacity building for youth and women in ecotourism and conservation activities.",
      "Incentives or small grants for conservation-friendly practices (e.g., reducing forest extraction, planting native trees).",
    ],
  },
  {
    id: "q9",
    text: "In your opinion, what is the most effective way for ecotourism revenue in Satchari NP to support biodiversity conservation?",
    options: [
      "Allocating a fixed portion of visitor fees directly to habitat restoration and species monitoring.",
      "Supporting community members engaged in habitat protection and wildlife observation (ecotour guides, forest guards, patrols).",
      "Improving park infrastructure for responsible visitor management (e.g., regulated trails, signage, waste facilities).",
      "Funding environmental education programs for visitors and local residents.",
      "Strengthening enforcement through capacity-building of Forest Department staff and field teams.",
    ],
  },
];

const ranks = ["1", "2", "3", "4", "5", "No"];

export default function App() {
  const { responses, updateRank } = useExclusiveRanking();
  const [otherText, setOtherText] = useState({});
  const [finalComment, setFinalComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [submissionError, setSubmissionError] = useState("");

  const handleSubmit = async () => {
    // Validate form
    const { isValid, errors } = validateForm(
      questions,
      responses,
      finalComment
    );

    if (!isValid) {
      setValidationErrors(errors);
      setSubmissionError(""); // Clear any previous submission errors
      const elementId = getFirstUnansweredElementId(errors);
      scrollToFirstError(elementId);
      return;
    }

    // Clear validation errors on successful validation
    setValidationErrors([]);
    setSubmissionError("");
    setLoading(true);

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      
      // Normalize and sanitize data
      const sanitizedOtherText = Object.entries(otherText).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: sanitizeTextInput(value),
        }),
        {}
      );

      const sanitizedFinalComment = sanitizeCommentInput(finalComment);

      const data = normalizeFormData(
        questions,
        responses,
        sanitizedOtherText,
        sanitizedFinalComment
      );

      // Submit with retry logic
      await submitForm(data, scriptUrl, {
        maxRetries: 3,
        timeout: 5000,
        onRetry: (attempt, error, delayMs) => {
          const isLastAttempt = delayMs === 0;
          const message = isLastAttempt
            ? `Failed to submit after ${attempt} attempts`
            : `Retrying... (attempt ${attempt + 1})`;
          console.log(`${message}: ${error.message}`);
        },
      });

      console.log("Form Data:", JSON.stringify(data, null, 2));
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionError(getErrorMessage(error));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md border-t-4 border-purple-600">
          <div className="text-5xl mb-4 text-purple-600">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  let currentSection = "";

  return (
    <div className="min-h-screen bg-purple-50 py-4 sm:py-6 px-2 sm:px-4">
      <style>{`
        input[type="checkbox"] {
          cursor: pointer;
          accent-color: #9333ea;
          width: 18px;
          height: 18px;
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow border-t-4 border-purple-600 p-4 sm:p-6 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-normal text-gray-800 mb-2">
            Questionnaire for Researchers on Sustainable Ecotourism in Satchari
            National Park
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            The purpose of this survey is to gather insights from researchers
            who have conducted or published studies at Satchari National Park.
          </p>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 sm:p-5 mb-6 rounded-lg">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Please complete all required questions
                </p>
                <p className="text-sm text-red-700 mt-1">
                  The following items need your attention:
                </p>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-red-700 flex items-start"
                    >
                      <span className="text-red-600 mr-2 font-bold">!</span>
                      <span>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setValidationErrors([])}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition"
                aria-label="Dismiss"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {submissionError && (
          <div className="bg-red-50 border border-red-200 p-4 sm:p-5 mb-6 rounded-lg">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Submission Failed
                </p>
                <p className="text-sm text-red-700 mt-1">{submissionError}</p>
              </div>
              <button
                onClick={() => setSubmissionError("")}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition"
                aria-label="Dismiss"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-medium">Instructions:</span> Select all that
            apply and rank if multiple are chosen
            <br />
            <span className="text-xs">
              1 = Most important, 2 = Next most important, 3 = Moderately
              important, 4 = Less important, 5 = Least important, No = Not
              selected
            </span>
          </p>
        </div>

        {questions.map((q) => {
          const questionId = `question-${q.id}`;
          const showSection = q.section && q.section !== currentSection;
          if (q.section) currentSection = q.section;

          return (
            <div key={q.id} id={questionId}>
              {showSection && (
                <div className="bg-purple-600 text-white p-3 sm:p-4 rounded-lg shadow mb-3 sm:mb-4 mt-4 sm:mt-6">
                  <h2 className="font-medium text-sm sm:text-base">
                    {q.section}
                  </h2>
                </div>
              )}
              <div
                className={`bg-white rounded-lg shadow p-4 sm:p-6 mb-3 sm:mb-4 border-l-4 ${
                  validationErrors.some((e) =>
                    e.qId === q.id
                  )
                    ? "border-red-500 ring-1 ring-red-200"
                    : "border-purple-600"
                }`}
              >
                <p className="text-sm sm:text-base text-gray-800 mb-4">
                  {q.text} <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mb-4 hidden sm:block">
                  (1 = Most important, 2 = Next most important, 3 = Moderately
                  important, 4 = Less important, 5 = Least important, No = Not
                  selected)
                </p>

                <div className="hidden md:block">
                  <div className="flex items-center mb-2 pb-2 border-b">
                    <div className="flex-1"></div>
                    <div className="flex">
                      {ranks.map((r) => (
                        <div
                          key={r}
                          className="w-12 text-center text-sm text-gray-600 font-medium"
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {q.options.map((opt, optIdx) => {
                      const currentRank = responses[q.id]?.[optIdx] || "";
                      return (
                        <div
                          key={optIdx}
                          className="flex items-center py-3 border-b border-gray-100 hover:bg-gray-50"
                        >
                          <div className="flex-1 text-sm text-gray-700 pr-4">
                            {opt}
                          </div>
                          <div className="flex">
                            {ranks.map((r) => (
                              <div key={r} className="w-12 flex justify-center">
                                <input
                                  key={`${q.id}-${optIdx}-${r}`}
                                  type="checkbox"
                                  name={`${q.id}-${optIdx}`}
                                  value={r}
                                  checked={currentRank === r}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateRank(q.id, optIdx, r);
                                    } else {
                                      updateRank(q.id, optIdx, "");
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="md:hidden space-y-4">
                  {q.options.map((opt, optIdx) => {
                    const currentRank = responses[q.id]?.[optIdx] || "";
                    return (
                      <div key={optIdx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 mb-3">{opt}</p>
                        <div className="flex justify-between items-center">
                          {ranks.map((r) => (
                            <label
                              key={r}
                              className="flex flex-col items-center cursor-pointer"
                            >
                              <input
                                key={`${q.id}-${optIdx}-${r}`}
                                type="checkbox"
                                name={`${q.id}-${optIdx}`}
                                value={r}
                                checked={currentRank === r}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateRank(q.id, optIdx, r);
                                  } else {
                                    updateRank(q.id, optIdx, "");
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-600">{r}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm text-gray-600 block mb-2">
                    Other (please specify):
                  </label>
                  <input
                    type="text"
                    className="w-full border-b-2 border-gray-300 focus:border-purple-600 outline-none py-2 text-sm bg-transparent"
                    placeholder="Your answer"
                    value={otherText[q.id] || ""}
                    onChange={(e) =>
                      setOtherText((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div
          id="final-comments"
          className={`bg-white rounded-lg shadow p-4 sm:p-6 mb-3 sm:mb-4 border-l-4 ${
            validationErrors.some((e) => e.type === "final-comment")
              ? "border-red-500 ring-1 ring-red-200"
              : "border-purple-600"
          }`}
        >
          <p className="text-sm sm:text-base text-gray-800 mb-4">
            Please share any additional recommendations for making ecotourism in
            Satchari National Park more effective, equitable, and sustainable
            for both biodiversity and local communities.{" "}
            <span className="text-red-500">*</span>
          </p>
          <textarea
            className="w-full border-b-2 border-gray-300 focus:border-purple-600 outline-none py-2 h-24 resize-none text-sm bg-transparent"
            placeholder="Your answer"
            value={finalComment}
            onChange={(e) => setFinalComment(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 text-white px-8 py-2.5 rounded font-medium hover:bg-purple-700 disabled:bg-gray-400 w-full sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <p className="text-xs text-gray-500 text-center sm:text-left">
            Never submit passwords through this form.
          </p>
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}
