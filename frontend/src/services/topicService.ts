import api from '../api/axios';
import type { TopicsApiResponse } from '../types/topic.types';

export const topicService = {
  getTopics: async (page = 1, limit = 10) => {
    const response = await api.get<TopicsApiResponse>('/topics', {
      params: { page, limit },
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
