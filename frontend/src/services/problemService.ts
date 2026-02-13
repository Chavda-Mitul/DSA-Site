import api from '../api/axios';
import type { Problem, PaginationInfo, ProblemQueryParams } from '../types/problem.types';

interface PaginatedProblemsResponse {
  success: boolean;
  message: string;
  data: Problem[];
  pagination: PaginationInfo;
}

export const problemService = {
  getProblemsByTopic: async (topicId: string, params: ProblemQueryParams = {}) => {
    const response = await api.get<PaginatedProblemsResponse>(`/topics/${topicId}/problems`, {
      params,
    });
    return {
      problems: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
