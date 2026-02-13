import api from '../api/axios';
import type { Problem, Difficulty, PaginationInfo } from '../types/problem.types';

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ProblemsResponse {
  success: boolean;
  message: string;
  data: Problem[];
  pagination: PaginationInfo;
}

export interface ProblemFormData {
  title: string;
  topicId: string;
  difficulty: Difficulty;
  order?: number;
  tags?: string[];
  youtubeUrl?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
}

export const adminProblemService = {
  getProblems: async (params: {
    page?: number;
    limit?: number;
    topicId?: string;
    difficulty?: Difficulty | '';
    includeInactive?: boolean;
  } = {}) => {
    const response = await api.get<ProblemsResponse>('/problems', {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        topicId: params.topicId || undefined,
        difficulty: params.difficulty || undefined,
        includeInactive: params.includeInactive || false,
      },
    });
    return {
      problems: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getProblem: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<Problem>>(`/problems/${id}`);
    return response.data.data;
  },

  createProblem: async (data: ProblemFormData) => {
    const response = await api.post<ApiSuccessResponse<Problem>>('/problems', data);
    return response.data.data;
  },

  updateProblem: async (id: string, data: ProblemFormData) => {
    const response = await api.put<ApiSuccessResponse<Problem>>(`/problems/${id}`, data);
    return response.data.data;
  },

  deleteProblem: async (id: string) => {
    await api.delete(`/problems/${id}`);
  },
};
