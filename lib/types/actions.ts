export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Helper type to ensure we handle both success and error cases
export type SafeActionResponse<T> = SuccessResponse<T> | ErrorResponse;
