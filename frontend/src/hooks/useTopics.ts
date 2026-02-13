import { useState, useCallback } from 'react';
import { topicService } from '../services/topicService';
import { extractErrorMessage } from '../utils/errorUtils';
import type { Topic, PaginationInfo } from '../types/topic.types';

interface UseTopicsReturn {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  fetchTopics: (page?: number) => Promise<void>;
}

export const useTopics = (): UseTopicsReturn => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchTopics = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const result = await topicService.getTopics(page);
      setTopics(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch topics'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    topics,
    loading,
    error,
    pagination,
    fetchTopics,
  };
};
