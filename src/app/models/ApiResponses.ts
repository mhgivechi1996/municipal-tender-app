export interface ApiResponse<T> {
  IsSuccess: boolean;
  Message: string;
  StatusCode: number;
  Result: T;
}

export interface PageResult<T> {
  PageNumber: number;
  PageSize: number;
  PagesCount: number;
  RecordsCount: number;
  Records: T[];
}

export type PageResponse<T> = ApiResponse<PageResult<T>>;
