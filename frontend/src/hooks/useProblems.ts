import { useState, useCallback, useEffect } from 'react';
import { problemService } from '../services/problemService';
import { extractErrorMessage } from '../utils/errorUtils';
import type { Problem, PaginationInfo, Difficulty, ProblemQueryParams } from '../types/problem.types';

interface UseProblemsReturn {
  problems: Problem[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  currentPage: number;
  difficulty: Difficulty | '';
  fetchProblems: (page?: number) => Promise<void>;
  setDifficulty: (difficulty: Difficulty | '') => void;
}

export const useProblems = (topicId: string): UseProblemsReturn => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');

  const fetchProblems = useCallback(
    async (page = 1) => {
      if (!topicId) return;

      setLoading(true);
      setError(null);

      try {
        const params: ProblemQueryParams = {
          page,
          limit: 10,
        };

        if (difficulty) {
          params.difficulty = difficulty;
        }

        const result = await problemService.getProblemsByTopic(topicId, params);
        setProblems(result.problems);
        setPagination(result.pagination);
        setCurrentPage(page);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to fetch problems'));
      } finally {
        setLoading(false);
      }
    },
    [topicId, difficulty]
  );

  const handleSetDifficulty = useCallback((newDifficulty: Difficulty | '') => {
    setDifficulty(newDifficulty);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (topicId) {
      fetchProblems(1);
    }
  }, [topicId, fetchProblems]);

  return {
    problems,
    loading,
    error,
    pagination,
    currentPage,
    difficulty,
    fetchProblems,
    setDifficulty: handleSetDifficulty,
  };
};
