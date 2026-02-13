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

// Backend response structure
interface BackendSummaryResponse {
  overall: {
    totalTopics: number;
    totalProblems: number;
    totalCompleted: number;
    overallCompletionRate: number;
  };
  byTopic: {
    topicId: string;
    title: string;
    slug: string;
    total: number;
    completed: number;
    remaining: number;
    completionRate: number;
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
    const response = await api.get<ApiSuccessResponse<BackendSummaryResponse>>('/progress/summary');
    const data = response.data.data;

    // Map backend response to frontend interface
    return {
      totalProblems: data.overall.totalProblems,
      completedProblems: data.overall.totalCompleted,
      overallPercentage: data.overall.overallCompletionRate,
      topicProgress: data.byTopic.map((topic) => ({
        topicId: topic.topicId,
        topicTitle: topic.title,
        totalProblems: topic.total,
        completedProblems: topic.completed,
        percentage: topic.completionRate,
      })),
    };
  },
};
