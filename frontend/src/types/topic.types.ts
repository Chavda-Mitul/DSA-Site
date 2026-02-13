export interface Topic {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  problemCount?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TopicsApiResponse {
  success: boolean;
  message: string;
  data: Topic[];
  pagination: PaginationInfo;
}
