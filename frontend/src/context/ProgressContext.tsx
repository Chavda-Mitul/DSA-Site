import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { progressService } from '../services/progressService';
import { authService } from '../services/authService';
import { extractErrorMessage } from '../utils/errorUtils';

interface ProgressContextType {
  completedIds: Set<string>;
  error: string | null;
  initializeProgress: (ids: string[]) => void;
  markCompleted: (problemId: string) => Promise<void>;
  unmarkCompleted: (problemId: string) => Promise<void>;
  isCompleted: (problemId: string) => boolean;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider = ({ children }: ProgressProviderProps) => {
  const { completedProblemIds, isAuthenticated } = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const initializeProgress = useCallback((ids: string[]) => {
    setCompletedIds(new Set(ids));
  }, []);

  useEffect(() => {
    if (isAuthenticated && completedProblemIds.length > 0) {
      initializeProgress(completedProblemIds);
    }
  }, [isAuthenticated, completedProblemIds, initializeProgress]);

  const refreshProgress = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const ids = await authService.getProgress();
      initializeProgress(ids);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  }, [isAuthenticated, initializeProgress]);

  const markCompleted = useCallback(async (problemId: string) => {
    const previousIds = new Set(completedIds);
    
    setCompletedIds((prev) => new Set([...prev, problemId]));
    setError(null);

    try {
      await progressService.markComplete(problemId);
    } catch (err) {
      setCompletedIds(previousIds);
      setError(extractErrorMessage(err, 'Failed to mark complete'));
      throw err;
    }
  }, [completedIds]);

  const unmarkCompleted = useCallback(async (problemId: string) => {
    const previousIds = new Set(completedIds);
    
    setCompletedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(problemId);
      return newSet;
    });
    setError(null);

    try {
      await progressService.unmarkComplete(problemId);
    } catch (err) {
      setCompletedIds(previousIds);
      setError(extractErrorMessage(err, 'Failed to unmark complete'));
      throw err;
    }
  }, [completedIds]);

  const isCompleted = useCallback(
    (problemId: string) => completedIds.has(problemId),
    [completedIds]
  );

  const value: ProgressContextType = {
    completedIds,
    error,
    initializeProgress,
    markCompleted,
    unmarkCompleted,
    isCompleted,
    refreshProgress,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
