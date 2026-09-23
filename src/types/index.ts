export type Role = 'ADMIN' | 'LEADER' | 'STAFF';

export type StoryStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'NEED_REVISION';

export type RiskLevel = 'THAP' | 'TRUNG_BINH' | 'CAO' | 'RAT_CAO';

export type CustomerSubmissionStatus = 
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'NEED_REVISION'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: Role;
  department: string;
  status: 'active' | 'locked';
  created_at: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  title: string;
  category_id: string;
  risk_level: RiskLevel;
  situation: string;
  scam_method: string;
  warning_signs: string[];
  recommended_action: string[];
  lesson: string;
  image_url?: string;
  author_id: string;
  author_name: string;
  status: StoryStatus;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  rejection_note?: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  source_type?: 'STAFF' | 'CUSTOMER' | 'ADMIN';
  source_submission_id?: string;
  helpful_votes?: number;
}

export interface CustomerStorySubmission {
  id: string;
  category_id: string;
  risk_level: RiskLevel;
  raw_title: string;
  raw_content: string;
  scam_method?: string;
  customer_action?: string;
  customer_lesson?: string;
  display_name?: string;
  is_anonymous: boolean;
  contact_email?: string;
  contact_phone?: string;
  image_urls?: string[];
  status: CustomerSubmissionStatus;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  published_story_id?: string;
  created_at: string;
  updated_at: string;
  // Editorial working fields (drafted by Leader before publish)
  edited_title?: string;
  edited_category_id?: string;
  edited_risk_level?: RiskLevel;
  edited_situation?: string;
  edited_scam_method?: string;
  edited_warning_signs?: string[];
  edited_recommended_action?: string[];
  edited_lesson?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number; // 0-based index
  explanation: string;
  category_id?: string;
  story_id?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  content: string;
  risk_level: 'KHAN_CAP' | 'MOI' | 'KHUYEN_NGHI';
  image_url?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface SystemSettings {
  bank_name: string;
  branch_name: string;
  department_name: string;
  hotline_support: string;
  hotline_branch: string;
  emergency_address: string;
  security_notice: string;
  app_name?: string;
  app_slogan?: string;
  share_story_enabled?: boolean;
  customer_submission_notice?: string;
}

export interface AnalyticsData {
  total_views: number;
  total_quizzes_taken: number;
  total_sos_clicks: number;
  story_views: Record<string, number>;
  category_interest: Record<string, number>;
  total_customer_submissions?: number;
  pending_customer_submissions?: number;
  published_customer_stories?: number;
  helpful_votes?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  role: Role | 'CUSTOMER';
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  old_status?: string;
  new_status?: string;
}

export interface QuizResultLog {
  id: string;
  quiz_id?: string;
  story_id?: string;
  total_questions: number;
  correct_count: number;
  score_ratio: number;
  timestamp: string;
  session_id: string;
}

export interface SyncQueueItem {
  id: string;
  entity_type: 'STORY' | 'CUSTOMER_SUBMISSION' | 'ALERT' | 'CATEGORY' | 'QUIZ' | 'SETTINGS' | 'USER' | 'AUDIT' | 'QUIZ_RESULT';
  entity_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  created_at: string;
  retry_count: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  last_error?: string;
}
