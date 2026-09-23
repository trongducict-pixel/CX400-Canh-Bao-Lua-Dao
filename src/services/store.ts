import { useState, useEffect } from 'react';
import {
  AlertItem,
  AnalyticsData,
  Category,
  QuizQuestion,
  Story,
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

const STORAGE_KEYS = {
  USERS: 'cx400_users',
  STORIES: 'cx400_stories',
  CATEGORIES: 'cx400_categories',
  QUIZZES: 'cx400_quizzes',
  ALERTS: 'cx400_alerts',
  SETTINGS: 'cx400_settings',
  ANALYTICS: 'cx400_analytics',
  CURRENT_USER: 'cx400_current_user',
  FONT_SCALE: 'cx400_font_scale',
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

const initialAnalytics: AnalyticsData = {
  total_views: 12480,
  total_quizzes_taken: 840,
  total_sos_clicks: 312,
  story_views: {},
  category_interest: {},
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
  login(username: string, password: string):User | null {
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
      notify();
      return user;
    }
    return null;
  },
  logout() {
    currentUserCache = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notify();
  },
  changePassword(userId: string, newPass: string) {
    usersCache = usersCache.map(u => (u.id === userId ? { ...u, password_hash: newPass } : u));
    safeSetItem(STORAGE_KEYS.USERS, usersCache);
    if (currentUserCache?.id === userId) {
      currentUserCache = { ...currentUserCache, password_hash: newPass };
      safeSetItem(STORAGE_KEYS.CURRENT_USER, currentUserCache);
    }
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
    storiesCache = storiesCache.map(s => (s.id === id ? { ...s, views_count: (s.views_count || 0) + 1 } : s));
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);
    
    analyticsCache.total_views = (analyticsCache.total_views || 0) + 1;
    analyticsCache.story_views[id] = (analyticsCache.story_views[id] || 0) + 1;
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
    };
    storiesCache = [story, ...storiesCache];
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);
    notify();
    return story;
  },
  updateStory(id: string, updates: Partial<Story>) {
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
    storiesCache = storiesCache.filter(s => s.id !== id);
    safeSetItem(STORAGE_KEYS.STORIES, storiesCache);
    notify();
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
    notify();
    return newCat;
  },
  updateCategory(id: string, updates: Partial<Category>) {
    categoriesCache = categoriesCache.map(c => (c.id === id ? { ...c, ...updates } : c));
    safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    notify();
  },
  deleteCategory(id: string) {
    categoriesCache = categoriesCache.filter(c => c.id !== id);
    safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
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
    notify();
    return newAlert;
  },
  updateAlert(id: string, updates: Partial<AlertItem>) {
    alertsCache = alertsCache.map(a => (a.id === id ? { ...a, ...updates } : a));
    safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    notify();
  },
  deleteAlert(id: string) {
    alertsCache = alertsCache.filter(a => a.id !== id);
    safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
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
    };
    quizzesCache = [...quizzesCache, newQuiz];
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    notify();
    return newQuiz;
  },
  updateQuiz(id: string, updates: Partial<QuizQuestion>) {
    quizzesCache = quizzesCache.map(q => (q.id === id ? { ...q, ...updates } : q));
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
    notify();
  },
  deleteQuiz(id: string) {
    quizzesCache = quizzesCache.filter(q => q.id !== id);
    safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
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
    };
    usersCache = [...usersCache, newUser];
    safeSetItem(STORAGE_KEYS.USERS, usersCache);
    notify();
    return newUser;
  },
  updateUser(id: string, updates: Partial<User>) {
    usersCache = usersCache.map(u => (u.id === id ? { ...u, ...updates } : u));
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
      this.updateUser(id, { status: user.status === 'active' ? 'locked' : 'active' });
    }
  },
  resetUserPassword(id: string, newPassword = '123') {
    this.updateUser(id, { password_hash: newPassword });
  },

  // Settings
  getSettings(): SystemSettings {
    return settingsCache;
  },
  updateSettings(updates: Partial<SystemSettings>) {
    settingsCache = { ...settingsCache, ...updates };
    safeSetItem(STORAGE_KEYS.SETTINGS, settingsCache);
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
  }) {
    if (data.stories && data.stories.length > 0) {
      storiesCache = data.stories;
      safeSetItem(STORAGE_KEYS.STORIES, storiesCache);
    }
    if (data.categories && data.categories.length > 0) {
      categoriesCache = data.categories;
      safeSetItem(STORAGE_KEYS.CATEGORIES, categoriesCache);
    }
    if (data.alerts && data.alerts.length > 0) {
      alertsCache = data.alerts;
      safeSetItem(STORAGE_KEYS.ALERTS, alertsCache);
    }
    if (data.quizzes && data.quizzes.length > 0) {
      quizzesCache = data.quizzes;
      safeSetItem(STORAGE_KEYS.QUIZZES, quizzesCache);
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
    analyticsCache = initialAnalytics;
    currentUserCache = null;
    notify();
  }
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
    lastSyncTime: store.getLastSyncTime(),
  };
}
