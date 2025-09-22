import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LoginCredentials } from '../types';
import { authService, User as AuthUser } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INIT_COMPLETE' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'INIT_COMPLETE':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const { user, token } = JSON.parse(storedUser);
          
          // Check if token is expired
          const decodedToken: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp > currentTime) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
          } else {
            localStorage.removeItem('user');
            dispatch({ type: 'INIT_COMPLETE' });
          }
        } else {
          dispatch({ type: 'INIT_COMPLETE' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
        dispatch({ type: 'INIT_COMPLETE' });
      }
    };

    initAuth();
  }, []); // Empty dependency array - only run once on mount

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Use real database authentication
      const response = await authService.login(credentials);

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({ user: response.user, token: response.token }));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.user, token: response.token } });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};