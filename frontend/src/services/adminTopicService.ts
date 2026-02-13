import api from '../api/axios';
import type { Topic, PaginationInfo } from '../types/topic.types';

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface TopicsResponse {
  success: boolean;
  message: string;
  data: Topic[];
  pagination: PaginationInfo;
}

export interface TopicFormData {
  title: string;
  description: string;
  order?: number;
}

export const adminTopicService = {
  getTopics: async (page = 1, limit = 10, includeInactive = false) => {
    const response = await api.get<TopicsResponse>('/topics', {
      params: { page, limit, includeInactive },
    });
    return {
      topics: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getTopic: async (id: string) => {
    const response = await api.get<ApiSuccessResponse<Topic>>(`/topics/${id}`);
    return response.data.data;
  },

  createTopic: async (data: TopicFormData) => {
    const response = await api.post<ApiSuccessResponse<Topic>>('/topics', data);
    return response.data.data;
  },

  updateTopic: async (id: string, data: TopicFormData) => {
    const response = await api.put<ApiSuccessResponse<Topic>>(`/topics/${id}`, data);
    return response.data.data;
  },

  deleteTopic: async (id: string) => {
    await api.delete(`/topics/${id}`);
  },
};
