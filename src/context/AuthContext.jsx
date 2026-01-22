import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { decodeMockJWT, getTokenFromStorage, setTokenInStorage, removeTokenFromStorage } from '../utils/jwtMock';
import { getUserById } from '../data/users';
import { loginUser, registerUser } from '../utils/dummyAuth';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = getTokenFromStorage();
    if (token) {
      const decoded = decodeMockJWT(token);
      if (decoded) {
        const user = getUserById(decoded.userId);
        if (user && user.isActive) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token }
          });
        } else {
          // Token valid but user not found or inactive
          removeTokenFromStorage();
        }
      } else {
        // Invalid token
        removeTokenFromStorage();
      }
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const authData = loginUser(email, password);

      setTokenInStorage(authData.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: authData.user, token: authData.token }
      });

      toast.success(`Welcome back, ${authData.user.name}!`);
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      toast.error(error.message);
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const authData = registerUser(userData);

      setTokenInStorage(authData.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: authData.user, token: authData.token }
      });

      toast.success(`Welcome to the platform, ${authData.user.name}!`);
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      toast.error(error.message);
    }
  };

  const logout = () => {
    removeTokenFromStorage();
    dispatch({ type: 'LOGOUT' });
    toast.info('Logged out successfully');
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
