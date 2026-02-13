export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  topicId: string | { _id: string; title: string; slug: string };
  youtubeUrl?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
  order: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProblemsResponse {
  success: boolean;
  message: string;
  data: {
    problems: Problem[];
    pagination: PaginationInfo;
  };
}

export interface ProblemQueryParams {
  page?: number;
  limit?: number;
  difficulty?: Difficulty | '';
  tag?: string;
  search?: string;
  sortBy?: 'order' | 'title' | 'difficulty' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  topicId?: string;
}
