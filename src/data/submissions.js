export const submissions = [
  {
    id: 1,
    assessmentId: 1,
    studentId: 1,
    studentName: "John Doe",
    submittedAt: "2024-01-25T11:30:00Z",
    status: "evaluated",
    totalScore: 42,
    maxScore: 50,
    percentage: 84,
    timeTaken: 55, // minutes
    answers: [
      {
        questionId: 1,
        type: "mcq",
        answer: "Array",
        isCorrect: true,
        points: 5,
        feedback: "Correct! Arrays are not primitive data types."
      },
      {
        questionId: 2,
        type: "multiple_choice",
        answer: ["Stack", "Queue", "Linked List"],
        isCorrect: true,
        points: 10,
        feedback: "Excellent! All linear data structures identified."
      },
      {
        questionId: 3,
        type: "short_answer",
        answer: "A stack follows LIFO (Last In First Out) principle while a queue follows FIFO (First In First Out). Stack example: browser back button. Queue example: printer queue.",
        isCorrect: true,
        points: 15,
        feedback: "Good explanation with clear examples."
      },
      {
        questionId: 4,
        type: "long_answer",
        answer: "A binary search tree is a binary tree where each node has at most two children, and for each node, all elements in its left subtree are less than the node, and all elements in its right subtree are greater. Real-world application: Database indexing for faster search operations.",
        isCorrect: true,
        points: 20,
        feedback: "Comprehensive answer with good real-world application."
      }
    ],
    instructorFeedback: "Excellent work! Strong understanding of data structures.",
    evaluatedBy: 2,
    evaluatedAt: "2024-01-25T14:00:00Z"
  },
  {
    id: 2,
    assessmentId: 2,
    studentId: 1,
    studentName: "John Doe",
    submittedAt: "2024-01-28T10:45:00Z",
    status: "evaluated",
    totalScore: 8,
    maxScore: 10,
    percentage: 80,
    timeTaken: 75,
    answers: [
      {
        questionId: 1,
        type: "mcq",
        answer: "2x",
        isCorrect: true,
        points: 4,
        feedback: "Correct derivative."
      },
      {
        questionId: 2,
        type: "short_answer",
        answer: "x³ + C",
        isCorrect: true,
        points: 6,
        feedback: "Correct integration."
      }
    ],
    instructorFeedback: "Good work on calculus problems.",
    evaluatedBy: 5,
    evaluatedAt: "2024-01-28T15:00:00Z"
  },
  {
    id: 3,
    assessmentId: 1,
    studentId: 4,
    studentName: "Alice Johnson",
    submittedAt: "2024-01-25T10:15:00Z",
    status: "pending",
    totalScore: null,
    maxScore: 50,
    percentage: null,
    timeTaken: 45,
    answers: [
      {
        questionId: 1,
        type: "mcq",
        answer: "String",
        isCorrect: false,
        points: 0,
        feedback: null
      }
    ],
    instructorFeedback: null,
    evaluatedBy: null,
    evaluatedAt: null
  },
  {
    id: 4,
    assessmentId: 4,
    studentId: 1,
    studentName: "John Doe",
    submittedAt: "2024-02-05T16:00:00Z",
    status: "pending",
    totalScore: null,
    maxScore: 25,
    percentage: null,
    timeTaken: null,
    answers: [
      {
        questionId: 1,
        type: "long_answer",
        answer: "Database schema design for university management system...",
        isCorrect: null,
        points: null,
        feedback: null
      }
    ],
    instructorFeedback: null,
    evaluatedBy: null,
    evaluatedAt: null
  }
];

export const getSubmissionById = (id) => {
  return submissions.find(submission => submission.id === id);
};

export const getSubmissionsByStudent = (studentId) => {
  return submissions.filter(submission => submission.studentId === studentId);
};

export const getSubmissionsByAssessment = (assessmentId) => {
  return submissions.filter(submission => submission.assessmentId === assessmentId);
};

export const getPendingSubmissions = () => {
  return submissions.filter(submission => submission.status === "pending");
};

export const getEvaluatedSubmissions = () => {
  return submissions.filter(submission => submission.status === "evaluated");
};

export const addSubmission = (submissionData) => {
  const newSubmission = {
    id: submissions.length + 1,
    ...submissionData,
    submittedAt: new Date().toISOString()
  };
  submissions.push(newSubmission);
  return newSubmission;
};

export const updateSubmission = (id, updates) => {
  const submissionIndex = submissions.findIndex(submission => submission.id === id);
  if (submissionIndex !== -1) {
    submissions[submissionIndex] = { ...submissions[submissionIndex], ...updates };
    return submissions[submissionIndex];
  }
  return null;
};
