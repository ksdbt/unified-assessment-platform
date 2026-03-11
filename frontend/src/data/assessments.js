export const assessments = [
  {
    id: 1,
    title: "Introduction to Data Structures",
    description: "Fundamental concepts of data structures including arrays, linked lists, and stacks.",
    subject: "Computer Science",
    instructorId: 2,
    instructorName: "Jane Smith",
    type: "quiz",
    duration: 60, // minutes
    totalQuestions: 20,
    passingScore: 70,
    difficulty: "intermediate",
    status: "active",
    scheduledDate: "2024-01-25T10:00:00Z",
    deadline: "2024-01-25T12:00:00Z",
    questions: [
      {
        id: 1,
        type: "mcq",
        question: "Which of the following is NOT a primitive data type in most programming languages?",
        options: ["Integer", "Float", "String", "Array"],
        correctAnswer: "Array",
        points: 5
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "Which data structures are considered linear?",
        options: ["Stack", "Queue", "Linked List", "Tree"],
        correctAnswers: ["Stack", "Queue", "Linked List"],
        points: 10
      },
      {
        id: 3,
        type: "short_answer",
        question: "Explain the difference between a stack and a queue with examples.",
        points: 15
      },
      {
        id: 4,
        type: "long_answer",
        question: "Describe how a binary search tree works and provide a real-world application.",
        points: 20
      }
    ],
    enrolledStudents: [1, 4],
    createdAt: "2024-01-20T10:00:00Z"
  },
  {
    id: 2,
    title: "Calculus Fundamentals",
    description: "Basic concepts of differential and integral calculus.",
    subject: "Mathematics",
    instructorId: 5,
    instructorName: "Bob Wilson",
    type: "exam",
    duration: 120,
    totalQuestions: 25,
    passingScore: 75,
    difficulty: "advanced",
    status: "active",
    scheduledDate: "2024-01-28T09:00:00Z",
    deadline: "2024-01-28T12:00:00Z",
    questions: [
      {
        id: 1,
        type: "mcq",
        question: "What is the derivative of x²?",
        options: ["x", "2x", "x²", "2"],
        correctAnswer: "2x",
        points: 4
      },
      {
        id: 2,
        type: "short_answer",
        question: "Find the integral of 3x² dx.",
        points: 6
      }
    ],
    enrolledStudents: [1],
    createdAt: "2024-01-22T10:00:00Z"
  },
  {
    id: 3,
    title: "Programming Basics Quiz",
    description: "Test your knowledge of basic programming concepts.",
    subject: "Computer Science",
    instructorId: 2,
    instructorName: "Jane Smith",
    type: "quiz",
    duration: 45,
    totalQuestions: 15,
    passingScore: 65,
    difficulty: "beginner",
    status: "draft",
    questions: [],
    enrolledStudents: [],
    createdAt: "2024-01-24T10:00:00Z"
  },
  {
    id: 4,
    title: "Database Design Principles",
    description: "Learn about relational database design and normalization.",
    subject: "Computer Science",
    instructorId: 2,
    instructorName: "Jane Smith",
    type: "assignment",
    duration: 0,
    totalQuestions: 5,
    passingScore: 80,
    difficulty: "intermediate",
    status: "active",
    scheduledDate: "2024-02-01T00:00:00Z",
    deadline: "2024-02-07T23:59:00Z",
    questions: [
      {
        id: 1,
        type: "long_answer",
        question: "Design a database schema for a university management system. Include entities for students, courses, instructors, and enrollments.",
        points: 25
      }
    ],
    enrolledStudents: [1, 4],
    createdAt: "2024-01-25T10:00:00Z"
  }
];

export const getAssessmentById = (id) => {
  return assessments.find(assessment => assessment.id === id);
};

export const getAssessmentsByInstructor = (instructorId) => {
  return assessments.filter(assessment => assessment.instructorId === instructorId);
};

export const getAssessmentsByStudent = (studentId) => {
  return assessments.filter(assessment => assessment.enrolledStudents.includes(studentId));
};

export const getAssessmentsBySubject = (subject) => {
  return assessments.filter(assessment => assessment.subject === subject);
};

export const getAssessmentsByStatus = (status) => {
  return assessments.filter(assessment => assessment.status === status);
};

export const addAssessment = (assessmentData) => {
  const newAssessment = {
    id: assessments.length + 1,
    ...assessmentData,
    createdAt: new Date().toISOString()
  };
  assessments.push(newAssessment);
  return newAssessment;
};

export const updateAssessment = (id, updates) => {
  const assessmentIndex = assessments.findIndex(assessment => assessment.id === id);
  if (assessmentIndex !== -1) {
    assessments[assessmentIndex] = { ...assessments[assessmentIndex], ...updates };
    return assessments[assessmentIndex];
  }
  return null;
};

export const deleteAssessment = (id) => {
  const assessmentIndex = assessments.findIndex(assessment => assessment.id === id);
  if (assessmentIndex !== -1) {
    assessments.splice(assessmentIndex, 1);
    return true;
  }
  return false;
};
