import api from '../api/axios';

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProgressSummary {
  totalProblems: number;
  completedProblems: number;
  overallPercentage: number;
  topicProgress: {
    topicId: string;
    topicTitle: string;
    totalProblems: number;
    completedProblems: number;
    percentage: number;
  }[];
}

export const progressService = {
  markComplete: async (problemId: string): Promise<void> => {
    await api.post(`/progress/${problemId}/complete`);
  },

  unmarkComplete: async (problemId: string): Promise<void> => {
    await api.delete(`/progress/${problemId}`);
  },

  getSummary: async (): Promise<ProgressSummary> => {
    const response = await api.get<ApiSuccessResponse<ProgressSummary>>('/progress/summary');
    return response.data.data;
  },
};
