/**
 * Core OrbisDB response types and interfaces
 */

/**
 * Generic response type for all OrbisDB operations
 */
export interface OrbisResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Response type for insert operations
 */
export interface OrbisInsertResponse
  extends OrbisResponse<{
    id: string;
    timestamp: number;
  }> {}

/**
 * Response type for update operations
 */
export interface OrbisUpdateResponse
  extends OrbisResponse<{
    id: string;
    timestamp: number;
  }> {}

/**
 * Response type for delete operations
 */
export interface OrbisDeleteResponse
  extends OrbisResponse<{
    id: string;
  }> {}

/**
 * Response type for select operations
 */
export interface OrbisSelectResponse<T>
  extends OrbisResponse<{
    rows: T[];
    count: number;
  }> {}

/**
 * Base type for all OrbisDB models
 */
export interface OrbisBaseModel {
  id: string;
  createdAt: number;
  updatedAt: number;
  creator: string;
}

/**
 * User profile data structure
 */
export interface OrbisUserProfile extends OrbisBaseModel {
  did: string;
  address?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication result type
 */
export interface OrbisAuthResult {
  did: string;
  details: {
    did: string;
    profile: OrbisUserProfile | null;
  };
}

/**
 * Error types for different OrbisDB operations
 */
export enum OrbisErrorType {
  AUTH_ERROR = "AUTH_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  NOT_FOUND = "NOT_FOUND",
  FORBIDDEN = "FORBIDDEN",
  UNKNOWN = "UNKNOWN",
}

/**
 * Custom error class for OrbisDB operations
 */
export class OrbisError extends Error {
  constructor(
    message: string,
    public type: OrbisErrorType,
    public details?: unknown
  ) {
    super(message);
    this.name = "OrbisError";
  }
}

interface OrbisInsertError {
  index?: number; // For bulk inserts
  message: string;
  data?: any;
}

interface OrbisInsertBulkResponse {
  success: OrbisInsertResponse[];
  errors: OrbisInsertError[];
}

// Type for the form data structure
interface FormData {
  // Add your form fields here
  title: string;
  assetId: string;
  category: string;
  location: string;
  playbackId: string;
  description: string;
  subtitlesUri: string;
  thumbnailUri: string;
  // ... other fields
}

// Base interfaces for the database schema
export interface VideoData {
  stream_id: string;
  controller: string;
  title: string;
  assetId: string;
  category?: string;
  location?: string;
  playbackId: string;
  description?: string;
  thumbnailUri?: string;
  subtitlesUri?: string;
}

export interface UserData {
  stream_id: string;
  controller: string;
  address: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

// Form data interfaces that match the schema
export interface VideoFormData
  extends Omit<VideoData, "stream_id" | "controller"> {
  // stream_id and controller will be handled by the backend
}

export interface UserFormData
  extends Omit<UserData, "stream_id" | "controller"> {
  // stream_id and controller will be handled by the backend
}
