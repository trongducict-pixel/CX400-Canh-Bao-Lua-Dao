import { useState, useEffect } from 'react';
import {
  AlertItem,
  AnalyticsData,
  AuditLog,
  Category,
  CustomerStorySubmission,
  CustomerSubmissionStatus,
  QuizQuestion,
  QuizResultLog,
  Story,
  SyncQueueItem,
  SystemSettings,
  User,
} from '../types';
import {
  INITIAL_ALERTS,
  INITIAL_CATEGORIES,
  INITIAL_QUIZZES,
  INITIAL_SETTINGS,
  INITIAL_STORIES,
  INITIAL_USERS,
} from '../data/initialData';
import { INITIAL_CUSTOMER_SUBMISSIONS } from '../data/initialSubmissions';

const STORAGE_KEYS = {
  USERS: 'cx400_users',
  STORIES: 'cx400_stories',
  CATEGORIES: 'cx400_categories',
  QUIZZES: 'cx400_quizzes',
  ALERTS: 'cx400_alerts',
  SETTINGS: 'cx400_settings',
  ANALYTICS: 'cx400_analytics',
  CURRENT_USER: 'cx400_current_user',
  CUSTOMER_SUBMISSIONS: 'cx400_customer_submissions',
  AUDIT_LOG: 'cx400_audit_log',
  QUIZ_RESULTS: 'cx400_quiz_results',
  SYNC_QUEUE: 'cx400_sync_queue',
  LAST_SYNC: 'cx400_last_sync',
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

// Initial state cache
let usersCache: User[] = safeGetItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
let storiesCache: Story[] = safeGetItem<Story[]>(STORAGE_KEYS.STORIES, INITIAL_STORIES);
let categoriesCache: Category[] = safeGetItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
let quizzesCache: QuizQuestion[] = safeGetItem<QuizQuestion[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
let alertsCache: AlertItem[] = safeGetItem<AlertItem[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
let settingsCache: SystemSettings = safeGetItem<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
let currentUserCache: User | null = safeGetItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
let customerSubmissionsCache: CustomerStorySubmission[] = safeGetItem<CustomerStorySubmission[]>(
  STORAGE_KEYS.CUSTOMER_SUBMISSIONS,
  INITIAL_CUSTOMER_SUBMISSIONS
);
let auditLogCache: AuditLog[] = safeGetItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOG, [
  {
    id: 'audit_init',
    timestamp: '2026-09-22T08:00:00Z',
    user_id: 'system',
    user_name: 'Hệ thống CX400',
    role: 'ADMIN',
    action: 'SYSTEM_BOOT',
    entity_type: 'SYSTEM',
    entity_id: 'sys_01',
    description: 'Khởi động hệ thống CX400 VietinBank Ninh Bình',
  },
]);
let quizResultsCache: QuizResultLog[] = safeGetItem<QuizResultLog[]>(STORAGE_KEYS.QUIZ_RESULTS, []);
let syncQueueCache: SyncQueueItem[] = safeGetItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);

const initialAnalytics: AnalyticsData = {
  total_views: 12480,
  total_quizzes_taken: 840,
  total_sos_clicks: 312,
  story_views: {},
  category_interest: {},
  total_customer_submissions: 3,
  pending_customer_submissions: 2,
  published_customer_stories: 0,
  helpful_votes: 156,
};
let analyticsCache: AnalyticsData = safeGetItem<AnalyticsData>(STORAGE_KEYS.ANALYTICS, initialAnalytics);

// Event listeners for state reactivity
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const store = {
  // Current user / Auth
  getCurrentUser(): User | null {
    return currentUserCache;
  },
  login(username: string, password: string): User | null {
    const trimmedUser = username.trim().toLowerCase();
    const user = usersCache.find(
      u => u.username.toLowerCase() === trimmedUser && u.password_hash === password
    );
    if (user) {
      if (user.status === 'locked') {
        throw new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên.');
      }
      currentUserCache = user;
      safeSetItem(STORAGE_KEYS.CURRENT_USER, user);

      // Audit log
      this.addAuditLog({
        user_id: user.id,
        user_name: user.full_name,
        role: user.role,
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: user.id,
        description: `Đăng nhập vào hệ thống (${user.role})`,
      });

      notify();
      return user;
    }
    return null;
  },
  logout() {
    if (currentUserCache) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'LOGOUT',
        entity_type: 'USER',
        entity_id: currentUserCache.id,
        description: 'Đăng xuất khỏi hệ thống',
      });
    }
    currentUserCache = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notify();
  },
  changePassword(userId: string, newPass: string) {
    usersCache = usersCache.map(u =>
      u.id === userId ? { ...u, password_hash: newPass, updated_at: new Date().toISOString() } : u
    );
    safeSetItem(STORAGE_KEYS.USERS, usersCache);
    if (currentUserCache?.id === userId) {
      currentUserCache = { ...currentUserCache, password_hash: newPass };
      safeSetItem(STORAGE_KEYS.CURRENT_USER, currentUserCache);
    }
    this.addAuditLog({
      user_id: userId,
      user_name: currentUserCache?.full_name || 'User',
      role: currentUserCache?.role || 'STAFF',
      action: 'CHANGE_PASSWORD',
      entity_type: 'USER',
      entity_id: userId,
      description: 'Đổi mật khẩu tài khoản thành công',
    });
    notify();
  },

  // Stories
  getStories(onlyPublished = false): Story[] {
    if (onlyPublished) {
      return storiesCache.filter(s => s.status === 'PUBLISHED');
    }
    return storiesCache;
  },
  getStoryById(id: string): Story | undefined {
    return storiesCache.find(s => s.id === id);
  },
  incrementStoryViews(id: string) {
    storiesCache = storiesCache.map(s =>
      s.id === id ? { ...s, views_count: (s.views_count || 0) + 1 } : s
    );
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);

    analyticsCache.total_views = (analyticsCache.total_views || 0) + 1;
    analyticsCache.story_views[id] = (analyticsCache.story_views[id] || 0) + 1;
    safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);
    notify();
  },
  voteStoryHelpful(id: string) {
    storiesCache = storiesCache.map(s =>
      s.id === id ? { ...s, helpful_votes: (s.helpful_votes || 0) + 1 } : s
    );
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);

    analyticsCache.helpful_votes = (analyticsCache.helpful_votes || 0) + 1;
    safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);
    notify();
  },
  createStory(newStory: Omit<Story, 'id' | 'created_at' | 'updated_at' | 'views_count'>): Story {
    const story: Story = {
      ...newStory,
      id: `story_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      views_count: 0,
      source_type: newStory.source_type || 'STAFF',
    };
    storiesCache = [story, ...storiesCache];
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);

    this.addToSyncQueue({
      entity_type: 'STORY',
      entity_id: story.id,
      operation: 'CREATE',
      payload: story,
    });

    if (currentUserCache) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'CREATE_STORY',
        entity_type: 'STORY',
        entity_id: story.id,
        description: `Tạo bài viết mới: "${story.title}"`,
        new_status: story.status,
      });
    }

    notify();
    return story;
  },
  updateStory(id: string, updates: Partial<Story>) {
    const oldStory = storiesCache.find(s => s.id === id);
    storiesCache = storiesCache.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);

    const updatedStory = storiesCache.find(s => s.id === id);
    if (updatedStory) {
      this.addToSyncQueue({
        entity_type: 'STORY',
        entity_id: id,
        operation: 'UPDATE',
        payload: updatedStory,
      });
    }

    if (currentUserCache && oldStory && updates.status && updates.status !== oldStory.status) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'UPDATE_STORY_STATUS',
        entity_type: 'STORY',
        entity_id: id,
        description: `Cập nhật trạng thái bài viết: "${oldStory.title}"`,
        old_status: oldStory.status,
        new_status: updates.status,
      });
    }

    notify();
  },
  submitStoryForApproval(id: string) {
    this.updateStory(id, {
      status: 'PENDING_APPROVAL',
      submitted_at: new Date().toISOString(),
      rejection_note: undefined,
    });
  },
  approveAndPublishStory(id: string, leaderName: string) {
    this.updateStory(id, {
      status: 'PUBLISHED',
      approved_by: leaderName,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      rejection_note: undefined,
    });
  },
  rejectStoryWithFeedback(id: string, leaderName: string, note: string) {
    this.updateStory(id, {
      status: 'NEED_REVISION',
      approved_by: leaderName,
      rejection_note: note,
    });
  },
  deleteStory(id: string) {
    const story = storiesCache.find(s => s.id === id);
    storiesCache = storiesCache.filter(s => s.id !== id);
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);

    this.addToSyncQueue({
      entity_type: 'STORY',
      entity_id: id,
      operation: 'DELETE',
      payload: { id },
    });

    if (currentUserCache && story) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'DELETE_STORY',
        entity_type: 'STORY',
        entity_id: id,
        description: `Xóa bài viết: "${story.title}"`,
      });
    }

    notify();
  },

  // =========================================================================
  // CUSTOMER STORY SUBMISSIONS (TÍNH NĂNG SỐ 5 & WORKFLOW PHÊ DUYỆT LÃNH ĐẠO)
  // =========================================================================
  getCustomerSubmissions(): CustomerStorySubmission[] {
    return customerSubmissionsCache;
  },
  getCustomerSubmissionById(id: string): CustomerStorySubmission | undefined {
    return customerSubmissionsCache.find(s => s.id === id);
  },
  createCustomerSubmission(
    submission: Omit<CustomerStorySubmission, 'id' | 'status' | 'submitted_at' | 'created_at' | 'updated_at'>
  ): CustomerStorySubmission {
    const newSubmission: CustomerStorySubmission = {
      ...submission,
      id: `sub_${Date.now()}`,
      status: 'PENDING_REVIEW', // Mandatory starting status
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    customerSubmissionsCache = [newSubmission, ...customerSubmissionsCache];
    safeSetItem(STORAGE_KEYS.CUSTOMER_SUBMISSIONS, customerSubmissionsCache);

    // Update analytics
    analyticsCache.total_customer_submissions = (analyticsCache.total_customer_submissions || 0) + 1;
    analyticsCache.pending_customer_submissions = (analyticsCache.pending_customer_submissions || 0) + 1;
    safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);

    // Audit log
    this.addAuditLog({
      user_id: 'customer',
      user_name: submission.is_anonymous ? 'Khách hàng ẩn danh' : submission.display_name || 'Khách hàng',
      role: 'CUSTOMER',
      action: 'SUBMIT_CUSTOMER_STORY',
      entity_type: 'CUSTOMER_SUBMISSION',
      entity_id: newSubmission.id,
      description: `Khách hàng gửi chia sẻ câu chuyện: "${newSubmission.raw_title}"`,
      new_status: 'PENDING_REVIEW',
    });

    // Enqueue for Google Sheets Sync
    this.addToSyncQueue({
      entity_type: 'CUSTOMER_SUBMISSION',
      entity_id: newSubmission.id,
      operation: 'CREATE',
      payload: newSubmission,
    });

    notify();
    return newSubmission;
  },
  updateCustomerSubmission(id: string, updates: Partial<CustomerStorySubmission>) {
    customerSubmissionsCache = customerSubmissionsCache.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });
    safeSetItem(STORAGE_KEYS.CUSTOMER_SUBMISSIONS, customerSubmissionsCache);

    const updated = customerSubmissionsCache.find(s => s.id === id);
    if (updated) {
      this.addToSyncQueue({
        entity_type: 'CUSTOMER_SUBMISSION',
        entity_id: id,
        operation: 'UPDATE',
        payload: updated,
      });
    }

    notify();
  },
  reviewCustomerSubmission(
    id: string,
    leaderName: string,
    status: CustomerSubmissionStatus,
    note?: string,
    editedFields?: Partial<CustomerStorySubmission>
  ) {
    const oldSub = customerSubmissionsCache.find(s => s.id === id);
    this.updateCustomerSubmission(id, {
      status,
      reviewed_by: leaderName,
      reviewed_at: new Date().toISOString(),
      review_note: note,
      ...editedFields,
    });

    if (currentUserCache && oldSub) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: leaderName,
        role: currentUserCache.role,
        action: 'REVIEW_CUSTOMER_SUBMISSION',
        entity_type: 'CUSTOMER_SUBMISSION',
        entity_id: id,
        description: `Lãnh đạo chuyển trạng thái câu chuyện khách hàng: "${oldSub.raw_title}" sang ${status}`,
        old_status: oldSub.status,
        new_status: status,
      });
    }
  },
  /**
   * DUYỆT & XUẤT BẢN: Chuyển Customer Submission thành Story chính thức xuất hiện trên Bản tin
   */
  publishCustomerSubmission(
    submissionId: string,
    leaderName: string,
    editorialData: {
      title: string;
      category_id: string;
      risk_level: any;
      situation: string;
      scam_method: string;
      warning_signs: string[];
      recommended_action: string[];
      lesson: string;
      image_url?: string;
    }
  ): Story {
    const sub = customerSubmissionsCache.find(s => s.id === submissionId);
    if (!sub) throw new Error('Không tìm thấy câu chuyện khách hàng');

    const authorDisplayName = sub.is_anonymous
      ? 'Khách hàng chia sẻ'
      : sub.display_name?.trim() || 'Khách hàng chia sẻ';

    // 1. Create official published Story
    const officialStory = this.createStory({
      title: editorialData.title,
      category_id: editorialData.category_id,
      risk_level: editorialData.risk_level,
      situation: editorialData.situation,
      scam_method: editorialData.scam_method,
      warning_signs: editorialData.warning_signs,
      recommended_action: editorialData.recommended_action,
      lesson: editorialData.lesson,
      image_url: editorialData.image_url || sub.image_urls?.[0],
      author_id: sub.id,
      author_name: authorDisplayName,
      status: 'PUBLISHED',
      source_type: 'CUSTOMER',
      source_submission_id: sub.id,
      approved_by: leaderName,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    });

    // 2. Mark submission as PUBLISHED and link published_story_id
    this.updateCustomerSubmission(submissionId, {
      status: 'PUBLISHED',
      reviewed_by: leaderName,
      reviewed_at: new Date().toISOString(),
      published_story_id: officialStory.id,
      ...editorialData,
    });

    // 3. Update analytics
    analyticsCache.published_customer_stories = (analyticsCache.published_customer_stories || 0) + 1;
    analyticsCache.pending_customer_submissions = Math.max(
      0,
      (analyticsCache.pending_customer_submissions || 1) - 1
    );
    safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);

    // 4. Audit
    this.addAuditLog({
      user_id: currentUserCache?.id || 'leader',
      user_name: leaderName,
      role: currentUserCache?.role || 'LEADER',
      action: 'PUBLISH_CUSTOMER_STORY',
      entity_type: 'CUSTOMER_SUBMISSION',
      entity_id: submissionId,
      description: `Xuất bản câu chuyện khách hàng thành bản tin chính thức (Story ID: ${officialStory.id})`,
      old_status: sub.status,
      new_status: 'PUBLISHED',
    });

    notify();
    return officialStory;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return auditLogCache;
  },
  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    auditLogCache = [log, ...auditLogCache.slice(0, 499)]; // Keep latest 500
    safeSetItem(STORAGE_KEYS.AUDIT_LOG, auditLogCache);
    notify();
  },

  // Quiz Results Logging
  getQuizResults(): QuizResultLog[] {
    return quizResultsCache;
  },
  logQuizResult(result: Omit<QuizResultLog, 'id' | 'timestamp'>) {
    const log: QuizResultLog = {
      ...result,
      id: `qres_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    quizResultsCache = [log, ...quizResultsCache.slice(0, 499)];
    safeSetItem(STORAGE_KEYS.QUIZ_RESULTS, quizResultsCache);

    this.trackEvent('quiz');
    notify();
  },

  // Sync Queue (Offline Resilient)
  getSyncQueue(): SyncQueueItem[] {
    return syncQueueCache;
  },
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'retry_count' | 'status'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      created_at: new Date().toISOString(),
      retry_count: 0,
      status: 'PENDING',
    };
    syncQueueCache = [...syncQueueCache, queueItem];
    safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueueCache);
  },
  markQueueItemSynced(id: string) {
    syncQueueCache = syncQueueCache.filter(q => q.id !== id);
    safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueueCache);
  },
  markQueueItemFailed(id: string, errorMsg: string) {
    syncQueueCache = syncQueueCache.map(q =>
      q.id === id ? { ...q, status: 'FAILED', retry_count: q.retry_count + 1, last_error: errorMsg } : q
    );
    safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueueCache);
  },

  // Categories
  getCategories(): Category[] {
    return categoriesCache;
  },
  addCategory(category: Omit<Category, 'id'>) {
    const newCat: Category = {
      ...category,
      id: `cat_${Date.now()}`,
    };
    categoriesCache = [...categoriesCache, newCat];
    safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    this.addToSyncQueue({
      entity_type: 'CATEGORY',
      entity_id: newCat.id,
      operation: 'CREATE',
      payload: newCat,
    });
    notify();
    return newCat;
  },
  updateCategory(id: string, updates: Partial<Category>) {
    categoriesCache = categoriesCache.map(c => (c.id === id ? { ...c, ...updates } : c));
    safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    const updated = categoriesCache.find(c => c.id === id);
    if (updated) {
      this.addToSyncQueue({
        entity_type: 'CATEGORY',
        entity_id: id,
        operation: 'UPDATE',
        payload: updated,
      });
    }
    notify();
  },
  deleteCategory(id: string) {
    categoriesCache = categoriesCache.filter(c => c.id !== id);
    safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    this.addToSyncQueue({
      entity_type: 'CATEGORY',
      entity_id: id,
      operation: 'DELETE',
      payload: { id },
    });
    notify();
  },

  // Alerts
  getAlerts(activeOnly = false): AlertItem[] {
    if (activeOnly) {
      return alertsCache.filter(a => a.status === 'active');
    }
    return alertsCache;
  },
  addAlert(alert: Omit<AlertItem, 'id' | 'created_at'>) {
    const newAlert: AlertItem = {
      ...alert,
      id: `alert_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    alertsCache = [newAlert, ...alertsCache];
    safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    this.addToSyncQueue({
      entity_type: 'ALERT',
      entity_id: newAlert.id,
      operation: 'CREATE',
      payload: newAlert,
    });
    notify();
    return newAlert;
  },
  updateAlert(id: string, updates: Partial<AlertItem>) {
    alertsCache = alertsCache.map(a => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a));
    safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    const updated = alertsCache.find(a => a.id === id);
    if (updated) {
      this.addToSyncQueue({
        entity_type: 'ALERT',
        entity_id: id,
        operation: 'UPDATE',
        payload: updated,
      });
    }
    notify();
  },
  deleteAlert(id: string) {
    alertsCache = alertsCache.filter(a => a.id !== id);
    safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    this.addToSyncQueue({
      entity_type: 'ALERT',
      entity_id: id,
      operation: 'DELETE',
      payload: { id },
    });
    notify();
  },

  // Quizzes
  getQuizzes(activeOnly = false): QuizQuestion[] {
    if (activeOnly) {
      return quizzesCache.filter(q => q.status === 'active');
    }
    return quizzesCache;
  },
  addQuiz(quiz: Omit<QuizQuestion, 'id'>) {
    const newQuiz: QuizQuestion = {
      ...quiz,
      id: `quiz_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    quizzesCache = [...quizzesCache, newQuiz];
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    this.addToSyncQueue({
      entity_type: 'QUIZ',
      entity_id: newQuiz.id,
      operation: 'CREATE',
      payload: newQuiz,
    });
    notify();
    return newQuiz;
  },
  updateQuiz(id: string, updates: Partial<QuizQuestion>) {
    quizzesCache = quizzesCache.map(q => (q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q));
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    const updated = quizzesCache.find(q => q.id === id);
    if (updated) {
      this.addToSyncQueue({
        entity_type: 'QUIZ',
        entity_id: id,
        operation: 'UPDATE',
        payload: updated,
      });
    }
    notify();
  },
  deleteQuiz(id: string) {
    quizzesCache = quizzesCache.filter(q => q.id !== id);
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    this.addToSyncQueue({
      entity_type: 'QUIZ',
      entity_id: id,
      operation: 'DELETE',
      payload: { id },
    });
    notify();
  },

  // Users (Admin)
  getUsers(): User[] {
    return usersCache;
  },
  addUser(userData: Omit<User, 'id' | 'created_at'>) {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    usersCache = [...usersCache, newUser];
    safeSetItem(STORAGE_KEYS.USERS, usersCache);

    if (currentUserCache) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'ADD_USER',
        entity_type: 'USER',
        entity_id: newUser.id,
        description: `Thêm người dùng mới: ${newUser.full_name} (${newUser.role})`,
      });
    }

    notify();
    return newUser;
  },
  updateUser(id: string, updates: Partial<User>) {
    usersCache = usersCache.map(u => (u.id === id ? { ...u, ...updates, updated_at: new Date().toISOString() } : u));
    safeSetItem(STORAGE_KEYS.USERS, usersCache);
    if (currentUserCache?.id === id) {
      currentUserCache = { ...currentUserCache, ...updates };
      safeSetItem(STORAGE_KEYS.CURRENT_USER, currentUserCache);
    }
    notify();
  },
  toggleUserLock(id: string) {
    const user = usersCache.find(u => u.id === id);
    if (user) {
      const nextStatus = user.status === 'active' ? 'locked' : 'active';
      this.updateUser(id, { status: nextStatus });
      if (currentUserCache) {
        this.addAuditLog({
          user_id: currentUserCache.id,
          user_name: currentUserCache.full_name,
          role: currentUserCache.role,
          action: 'TOGGLE_LOCK_USER',
          entity_type: 'USER',
          entity_id: id,
          description: `Khóa/Mở khóa người dùng: ${user.full_name} -> ${nextStatus}`,
        });
      }
    }
  },
  resetUserPassword(id: string, newPassword = '123') {
    this.updateUser(id, { password_hash: newPassword });
    if (currentUserCache) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'RESET_PASSWORD',
        entity_type: 'USER',
        entity_id: id,
        description: 'Đặt lại mật khẩu mặc định (123)',
      });
    }
  },

  // Settings
  getSettings(): SystemSettings {
    return settingsCache;
  },
  updateSettings(updates: Partial<SystemSettings>) {
    settingsCache = { ...settingsCache, ...updates };
    safeSetItem(STORAGE_KEYS.SETTINGS, settingsCache);
    this.addToSyncQueue({
      entity_type: 'SETTINGS',
      entity_id: 'settings_main',
      operation: 'UPDATE',
      payload: settingsCache,
    });
    if (currentUserCache) {
      this.addAuditLog({
        user_id: currentUserCache.id,
        user_name: currentUserCache.full_name,
        role: currentUserCache.role,
        action: 'UPDATE_SETTINGS',
        entity_type: 'SETTINGS',
        entity_id: 'settings_main',
        description: 'Cập nhật cấu hình thông tin hệ thống',
      });
    }
    notify();
  },

  // Analytics & Tracking
  getAnalytics(): AnalyticsData {
    return analyticsCache;
  },
  trackEvent(type: 'view' | 'quiz' | 'sos', contentId?: string) {
    if (type === 'quiz') {
      analyticsCache.total_quizzes_taken = (analyticsCache.total_quizzes_taken || 0) + 1;
    } else if (type === 'sos') {
      analyticsCache.total_sos_clicks = (analyticsCache.total_sos_clicks || 0) + 1;
    } else if (type === 'view') {
      analyticsCache.total_views = (analyticsCache.total_views || 0) + 1;
      if (contentId) {
        analyticsCache.story_views[contentId] = (analyticsCache.story_views[contentId] || 0) + 1;
      }
    }
    safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);
    notify();
  },

  // Google Sheets Sync
  getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },
  setLastSyncTime(isoDate: string) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, isoDate);
    notify();
  },
  applySheetImport(data: {
    stories?: Story[];
    categories?: Category[];
    alerts?: AlertItem[];
    quizzes?: QuizQuestion[];
    settings?: Partial<SystemSettings>;
    analytics?: Partial<AnalyticsData>;
    customerSubmissions?: CustomerStorySubmission[];
    users?: Partial<User>[];
  }) {
    if (data.stories && data.stories.length > 0) {
      // Safe upsert by ID to preserve local entries and not blindly destroy
      const map = new Map<string, Story>(storiesCache.map(s => [s.id, s]));
      data.stories.forEach(st => {
        const existing = map.get(st.id);
        if (existing) {
          map.set(st.id, {
            ...existing,
            ...st,
            views_count: Math.max(existing.views_count || 0, st.views_count || 0),
          });
        } else {
          map.set(st.id, st);
        }
      });
      storiesCache = Array.from(map.values());
      safeSetItem(STORAGE_KEYS.STORIES, storiesCache);
    }
    if (data.categories && data.categories.length > 0) {
      const map = new Map<string, Category>(categoriesCache.map(c => [c.id, c]));
      data.categories.forEach(c => map.set(c.id, c));
      categoriesCache = Array.from(map.values());
      safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    }
    if (data.alerts && data.alerts.length > 0) {
      const map = new Map<string, AlertItem>(alertsCache.map(a => [a.id, a]));
      data.alerts.forEach(a => map.set(a.id, a));
      alertsCache = Array.from(map.values());
      safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    }
    if (data.quizzes && data.quizzes.length > 0) {
      const map = new Map<string, QuizQuestion>(quizzesCache.map(q => [q.id, q]));
      data.quizzes.forEach(q => map.set(q.id, q));
      quizzesCache = Array.from(map.values());
      safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    }
    if (data.customerSubmissions && data.customerSubmissions.length > 0) {
      const map = new Map<string, CustomerStorySubmission>(customerSubmissionsCache.map(c => [c.id, c]));
      data.customerSubmissions.forEach(sub => {
        const existing = map.get(sub.id);
        if (existing) {
          map.set(sub.id, { ...existing, ...sub });
        } else {
          map.set(sub.id, sub);
        }
      });
      customerSubmissionsCache = Array.from(map.values());
      safeSetItem(STORAGE_KEYS.CUSTOMER_SUBMISSIONS, customerSubmissionsCache);
    }
    if (data.settings && Object.keys(data.settings).length > 0) {
      settingsCache = { ...settingsCache, ...data.settings };
      safeSetItem(STORAGE_KEYS.SETTINGS, settingsCache);
    }
    if (data.analytics && Object.keys(data.analytics).length > 0) {
      analyticsCache = { ...analyticsCache, ...data.analytics };
      safeSetItem(STORAGE_KEYS.ANALYTICS, analyticsCache);
    }
    this.setLastSyncTime(new Date().toISOString());
    notify();
  },

  // Reset to initial demo data
  resetToDefault() {
    localStorage.clear();
    usersCache = INITIAL_USERS;
    storiesCache = INITIAL_STORIES;
    categoriesCache = INITIAL_CATEGORIES;
    quizzesCache = INITIAL_QUIZZES;
    alertsCache = INITIAL_ALERTS;
    settingsCache = INITIAL_SETTINGS;
    customerSubmissionsCache = INITIAL_CUSTOMER_SUBMISSIONS;
    analyticsCache = initialAnalytics;
    currentUserCache = null;
    auditLogCache = [];
    quizResultsCache = [];
    syncQueueCache = [];
    notify();
  },
};

// React hook for easy reactive state access
export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const pendingSubmissionsCount = customerSubmissionsCache.filter(
    s => s.status === 'PENDING_REVIEW' || s.status === 'UNDER_REVIEW'
  ).length;

  return {
    currentUser: store.getCurrentUser(),
    stories: store.getStories(),
    publishedStories: store.getStories(true),
    categories: store.getCategories(),
    alerts: store.getAlerts(),
    activeAlerts: store.getAlerts(true),
    quizzes: store.getQuizzes(true),
    allQuizzes: store.getQuizzes(false),
    users: store.getUsers(),
    settings: store.getSettings(),
    analytics: store.getAnalytics(),
    customerSubmissions: store.getCustomerSubmissions(),
    pendingSubmissionsCount,
    auditLogs: store.getAuditLogs(),
    quizResults: store.getQuizResults(),
    syncQueue: store.getSyncQueue(),
    lastSyncTime: store.getLastSyncTime(),
  };
}
