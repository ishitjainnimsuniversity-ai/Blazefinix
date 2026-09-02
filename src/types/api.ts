/**
 * LOOP — Customer-Feedback Intelligence Platform
 * Shared TypeScript API Types & Frontend Integration Contracts
 */

export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

export type FeedbackStatus = "NEW" | "REVIEWED" | "RESOLVED" | "ARCHIVED";

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type ProcessingStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDto {
  id: string;
  workspaceId: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackThemeDto {
  id: string;
  name: string;
  description?: string | null;
}

export interface AiAnalysisDto {
  id: string;
  feedbackId: string;
  sentiment: Sentiment;
  sentimentScore: number;
  themes: string[];
  featureArea: string;
  rationale: string;
  model: string;
  processingStatus: ProcessingStatus;
  createdAt: string;
}

export interface FeedbackDto {
  id: string;
  workspaceId: string;
  source: string;
  customerName?: string | null;
  customerEmail?: string | null;
  rawText: string;
  status: FeedbackStatus;
  sentiment?: Sentiment | null;
  sentimentScore?: number | null;
  featureArea?: string | null;
  aiRationale?: string | null;
  aiStatus: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  analysis?: AiAnalysisDto | null;
  themes?: FeedbackThemeDto[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FeedbackListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sentiment?: Sentiment;
  theme?: string;
  status?: FeedbackStatus;
  source?: string;
  featureArea?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "sentimentScore" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateFeedbackInput {
  rawText: string;
  source?: string;
  customerName?: string | null;
  customerEmail?: string | null;
  status?: FeedbackStatus;
  skipAi?: boolean;
}

export interface UpdateFeedbackStatusInput {
  status: FeedbackStatus;
}

export interface BatchUpdateStatusInput {
  feedbackIds: string[];
  status: FeedbackStatus;
}

export interface CsvRowError {
  rowNumber: number;
  data: Record<string, any>;
  reason: string;
}

export type CsvImportErrorRow = CsvRowError;

export interface CsvImportResult {
  total: number;
  successful: number;
  failed: number;
  createdIds: string[];
  errors: CsvRowError[];
}

export interface SimulatedIngestInput {
  source: "Website" | "App" | "Support" | "Survey" | "Social";
  text: string;
  customerIdentifier?: string | null;
  customerEmail?: string | null;
  metadata?: Record<string, any>;
  skipAi?: boolean;
}

export interface DashboardKpis {
  totalFeedback: number;
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sentimentPercentages: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageSentimentScore: number;
  activeThemesCount: number;
  activeSpikesCount: number;
  statusCounts: {
    new: number;
    reviewed: number;
    resolved: number;
    archived: number;
  };
}

export interface ThemeStatItem {
  id: string;
  name: string;
  description: string | null;
  count: number;
  percentage: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentTrend: "UP" | "DOWN" | "STABLE";
}

export interface TrendDataPoint {
  date: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface TrendResponse {
  period: "7d" | "30d" | "90d";
  dataPoints: TrendDataPoint[];
}

export interface SpikeDetectionItem {
  theme: string;
  currentCount: number;
  baselineAverage: number;
  changePercent: number;
  isSpike: boolean;
  explanation: string;
}

export interface AskLoopRequest {
  question: string;
  topK?: number;
}

export type AskLoopInput = AskLoopRequest;

export interface EvidenceItem {
  feedbackId: string;
  text: string;
  similarity: number;
  source: string;
  sentiment?: Sentiment | null;
  featureArea?: string | null;
  createdAt: string;
}

export interface AskLoopResponse {
  question: string;
  answer: string;
  grounded: boolean;
  evidence: EvidenceItem[];
  metadata: {
    retrievedCount: number;
    averageSimilarity: number;
    model: string;
  };
}

export interface VocReportDto {
  id: string;
  workspaceId: string;
  period: string;
  totalFeedback: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  topThemes: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  spikes: SpikeDetectionItem[];
  aiNarrative: string;
  generatedAt: string;
}

export interface GenerateVocReportInput {
  period?: "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "All Time";
  days?: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
