export const users = [
  {
    id: 1,
    name: "John Doe",
    email: "student@example.com",
    password: "password123",
    role: "student",
    instituteCode: "INST001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    profile: {
      phone: "+1-234-567-8900",
      address: "123 Main St, City, State",
      dateOfBirth: "1995-05-15",
      enrollmentDate: "2023-01-15",
      performance: {
        totalAssessments: 12,
        averageScore: 85,
        completedAssessments: 10,
        pendingAssessments: 2
      }
    },
    isActive: true,
    createdAt: "2023-01-15T10:00:00Z"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "instructor@example.com",
    password: "password123",
    role: "instructor",
    instituteCode: "INST001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    profile: {
      phone: "+1-234-567-8901",
      address: "456 Oak St, City, State",
      department: "Computer Science",
      specialization: "Data Structures",
      experience: 8,
      totalAssessments: 25,
      activeAssessments: 5
    },
    isActive: true,
    createdAt: "2023-01-10T10:00:00Z"
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
    instituteCode: "INST001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    profile: {
      phone: "+1-234-567-8902",
      address: "789 Pine St, City, State"
    },
    isActive: true,
    createdAt: "2023-01-01T10:00:00Z"
  },
  {
    id: 4,
    name: "Alice Johnson",
    email: "alice@student.com",
    password: "password123",
    role: "student",
    instituteCode: "INST001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    profile: {
      phone: "+1-234-567-8903",
      address: "321 Elm St, City, State",
      dateOfBirth: "1998-03-20",
      enrollmentDate: "2023-02-01",
      performance: {
        totalAssessments: 8,
        averageScore: 92,
        completedAssessments: 8,
        pendingAssessments: 0
      }
    },
    isActive: true,
    createdAt: "2023-02-01T10:00:00Z"
  },
  {
    id: 5,
    name: "Bob Wilson",
    email: "bob@instructor.com",
    password: "password123",
    role: "instructor",
    instituteCode: "INST001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    profile: {
      phone: "+1-234-567-8904",
      address: "654 Maple St, City, State",
      department: "Mathematics",
      specialization: "Calculus",
      experience: 12,
      totalAssessments: 18,
      activeAssessments: 3
    },
    isActive: true,
    createdAt: "2023-01-05T10:00:00Z"
  }
];

export const getUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

export const getUserById = (id) => {
  return users.find(user => user.id === id);
};

export const getUsersByRole = (role) => {
  return users.filter(user => user.role === role);
};

export const addUser = (userData) => {
  const newUser = {
    id: users.length + 1,
    ...userData,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
};

export const updateUser = (id, updates) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
  }
  return null;
};

export const deleteUser = (id) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    return true;
  }
  return false;
};
