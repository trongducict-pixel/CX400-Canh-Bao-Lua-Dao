export type Role = 'ADMIN' | 'LEADER' | 'STAFF';

export type StoryStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'NEED_REVISION';

export type RiskLevel = 'THAP' | 'TRUNG_BINH' | 'CAO' | 'RAT_CAO';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: Role;
  department: string;
  status: 'active' | 'locked';
  created_at: string;
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
}

export interface SystemSettings {
  bank_name: string;
  branch_name: string;
  department_name: string;
  hotline_support: string;
  hotline_branch: string;
  emergency_address: string;
  security_notice: string;
}

export interface AnalyticsData {
  total_views: number;
  total_quizzes_taken: number;
  total_sos_clicks: number;
  story_views: Record<string, number>;
  category_interest: Record<string, number>;
}
