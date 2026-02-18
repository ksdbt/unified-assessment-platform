// Mock JWT implementation for UI-only demo

const JWT_SECRET = "unified-assessment-platform-secret-key";

// Simple base64 encoding (not secure, just for demo)
const base64Encode = (str) => {
  try {
    return btoa(str);
  } catch (e) {
    return Buffer.from(str).toString('base64');
  }
};

const base64Decode = (str) => {
  try {
    return atob(str);
  } catch (e) {
    return Buffer.from(str, 'base64').toString();
  }
};

export const generateMockJWT = (payload) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 hours

  const jwtPayload = {
    ...payload,
    iat: now,
    exp: exp
  };

  const encodedHeader = base64Encode(JSON.stringify(header));
  const encodedPayload = base64Encode(JSON.stringify(jwtPayload));

  // Mock signature (not real, just for demo)
  const signature = base64Encode("mock-signature");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const decodeMockJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(base64Decode(parts[1]));

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  try {
    const decoded = decodeMockJWT(token);
    return decoded !== null;
  } catch (error) {
    return false;
  }
};

export const getTokenFromStorage = () => {
  return localStorage.getItem('authToken');
};

export const setTokenInStorage = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeTokenFromStorage = () => {
  localStorage.removeItem('authToken');
};
