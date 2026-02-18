import { users, getUserByEmail } from '../data/users';
import { generateMockJWT } from './jwtMock';

export const loginUser = (email, password) => {
  const user = getUserByEmail(email);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.password !== password) {
    throw new Error('Invalid password');
  }

  if (!user.isActive) {
    throw new Error('Account is suspended');
  }

  // Generate mock JWT token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    instituteCode: user.instituteCode
  };

  const token = generateMockJWT(tokenPayload);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      instituteCode: user.instituteCode
    },
    token
  };
};

export const registerUser = (userData) => {
  const { name, email, password, role, instituteCode } = userData;

  // Check if user already exists
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create new user
  const newUser = {
    name,
    email,
    password,
    role,
    instituteCode,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`,
    profile: {}
  };

  // Add to users array
  const addedUser = users.push({
    id: users.length + 1,
    ...newUser,
    isActive: true,
    createdAt: new Date().toISOString()
  });

  // Generate token for new user
  const tokenPayload = {
    userId: addedUser.id,
    email: addedUser.email,
    role: addedUser.role,
    name: addedUser.name,
    instituteCode: addedUser.instituteCode
  };

  const token = generateMockJWT(tokenPayload);

  return {
    user: {
      id: addedUser.id,
      name: addedUser.name,
      email: addedUser.email,
      role: addedUser.role,
      avatar: addedUser.avatar,
      instituteCode: addedUser.instituteCode
    },
    token
  };
};

export const validateUserCredentials = (email, password) => {
  try {
    const result = loginUser(email, password);
    return result;
  } catch (error) {
    return null;
  }
};

export const getCurrentUserFromToken = (token) => {
  // This will be handled by AuthContext
  return null;
};
