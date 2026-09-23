import { getAccessToken } from './googleAuth';
import {
  AlertItem,
  AnalyticsData,
  Category,
  QuizQuestion,
  RiskLevel,
  Story,
  StoryStatus,
  SystemSettings,
} from '../types';

export interface SheetSyncSummary {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt: string;
  storiesCount: number;
  categoriesCount: number;
  alertsCount: number;
  quizzesCount: number;
}

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxLw8QfUX8Pd5NSsjVNK9ZXM5u_PVCy6CG_zGHWGlC_zcjjjEiL1KHjjT427xskCIMmEA/exec';

const STORAGE_SHEET_CONFIG = 'cx400_google_sheet_config';
const STORAGE_APPS_SCRIPT_URL = 'cx400_apps_script_url';

export function getAppsScriptUrl(): string {
  return localStorage.getItem(STORAGE_APPS_SCRIPT_URL) || DEFAULT_APPS_SCRIPT_URL;
}

export function saveAppsScriptUrl(url: string) {
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_APPS_SCRIPT_URL);
  } else {
    localStorage.setItem(STORAGE_APPS_SCRIPT_URL, url.trim());
  }
}

export function getStoredSheetConfig(): { spreadsheetId: string; title: string; url: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredSheetConfig(config: { spreadsheetId: string; title: string; url: string } | null) {
  if (!config) {
    localStorage.removeItem(STORAGE_SHEET_CONFIG);
  } else {
    localStorage.setItem(STORAGE_SHEET_CONFIG, JSON.stringify(config));
  }
}

/**
 * Helper to call Google Sheets API with authorization header
 */
async function sheetsFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại Google.');
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const message = errJson?.error?.message || `Lỗi API Google Sheets (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

/**
 * Creates a brand new Google Spreadsheet with all required sheets
 */
export async function createGoogleSpreadsheet(
  title = '[VietinBank Ninh Bình] Dữ liệu Cảnh giác Lừa đảo - CX400'
): Promise<{ spreadsheetId: string; url: string; title: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'Cau_Chuyen', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Canh_Bao', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Danh_Muc', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Quiz', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Cai_Dat', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Thong_Ke', gridProperties: { frozenRowCount: 1 } } },
    ],
  };

  const data = await sheetsFetch('', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const config = {
    spreadsheetId: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    title: data.properties?.title || title,
  };

  saveStoredSheetConfig(config);
  return config;
}

/**
 * Ensures required sheet tabs exist in an existing Google Spreadsheet
 */
export async function ensureSheetTabs(spreadsheetId: string) {
  const meta = await sheetsFetch(`/${spreadsheetId}?fields=sheets.properties.title`);
  const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

  const requiredSheets = ['Cau_Chuyen', 'Canh_Bao', 'Danh_Muc', 'Quiz', 'Cai_Dat', 'Thong_Ke'];
  const missing = requiredSheets.filter(t => !existingTitles.includes(t));

  if (missing.length > 0) {
    const requests = missing.map(title => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await sheetsFetch(`/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }
}

/**
 * PUSH (EXPORT): Sync local app state up to Google Sheets
 */
export async function pushAllDataToSheet(
  spreadsheetId: string,
  payload: {
    stories: Story[];
    categories: Category[];
    alerts: AlertItem[];
    quizzes: QuizQuestion[];
    settings: SystemSettings;
    analytics: AnalyticsData;
  }
): Promise<void> {
  await ensureSheetTabs(spreadsheetId);

  // 1. Stories Rows
  const storiesHeaders = [
    'ID',
    'Tiêu đề',
    'Mã danh mục',
    'Mức độ rủi ro',
    'Tình huống',
    'Thủ đoạn lừa đảo',
    'Dấu hiệu cảnh báo (phân cách bởi ||)',
    'Hành động khuyến nghị (phân cách bởi ||)',
    'Bài học ghi nhớ',
    'Tác giả',
    'Trạng thái (DRAFT/PENDING_APPROVAL/PUBLISHED/NEED_REVISION)',
    'Lượt xem',
    'Link ảnh',
    'Ghi chú duyệt',
    'Cập nhật lúc',
  ];
  const storiesData = payload.stories.map(s => [
    s.id,
    s.title,
    s.category_id,
    s.risk_level,
    s.situation,
    s.scam_method,
    (s.warning_signs || []).join(' || '),
    (s.recommended_action || []).join(' || '),
    s.lesson,
    s.author_name,
    s.status,
    s.views_count,
    s.image_url || '',
    s.rejection_note || '',
    s.updated_at,
  ]);

  // 2. Alerts Rows
  const alertsHeaders = [
    'ID',
    'Tiêu đề',
    'Nội dung chi tiết',
    'Mức độ rủi ro (KHAN_CAP/MOI/KHUYEN_NGHI)',
    'Trạng thái (active/inactive)',
    'Link ảnh',
    'Ngày tạo',
  ];
  const alertsData = payload.alerts.map(a => [
    a.id,
    a.title,
    a.content,
    a.risk_level,
    a.status,
    a.image_url || '',
    a.created_at,
  ]);

  // 3. Categories Rows
  const categoriesHeaders = ['ID', 'Tên danh mục', 'Biểu tượng (Icon)', 'Mô tả', 'Trạng thái'];
  const categoriesData = payload.categories.map(c => [
    c.id,
    c.name,
    c.icon,
    c.description,
    c.status,
  ]);

  // 4. Quizzes Rows
  const quizzesHeaders = [
    'ID',
    'Câu hỏi',
    'Đáp án 1',
    'Đáp án 2',
    'Đáp án 3',
    'Đáp án 4',
    'Chỉ số đáp án đúng (0, 1, 2, hoặc 3)',
    'Giải thích chi tiết',
    'Mã tình huống liên quan',
    'Trạng thái',
  ];
  const quizzesData = payload.quizzes.map(q => [
    q.id,
    q.question,
    q.options[0] || '',
    q.options[1] || '',
    q.options[2] || '',
    q.options[3] || '',
    q.correct_answer,
    q.explanation,
    q.story_id || '',
    q.status,
  ]);

  // 5. Settings Rows
  const settingsHeaders = ['Mã cấu hình', 'Giá trị', 'Mô tả'];
  const settingsData = [
    ['bank_name', payload.settings.bank_name, 'Tên ngân hàng'],
    ['branch_name', payload.settings.branch_name, 'Tên chi nhánh'],
    ['department_name', payload.settings.department_name, 'Phòng ban đầu mối'],
    ['hotline_support', payload.settings.hotline_support, 'Hotline 24/7 toàn quốc'],
    ['hotline_branch', payload.settings.hotline_branch, 'Hotline trực tiếp Ninh Bình'],
    ['emergency_address', payload.settings.emergency_address, 'Địa chỉ tiếp đón khách hàng'],
    ['security_notice', payload.settings.security_notice, 'Thông điệp cảnh báo an toàn'],
  ];

  // 6. Analytics Rows
  const analyticsHeaders = ['Chỉ số', 'Số lượng', 'Mô tả'];
  const analyticsData = [
    ['total_views', payload.analytics.total_views, 'Tổng lượt xem bài học & cảnh báo'],
    ['total_quizzes_taken', payload.analytics.total_quizzes_taken, 'Số lượt hoàn thành trắc nghiệm phản xạ'],
    ['total_sos_clicks', payload.analytics.total_sos_clicks, 'Số lượt mở hướng dẫn khẩn cấp SOS'],
    ['last_sync', new Date().toLocaleString('vi-VN'), 'Thời điểm đồng bộ gần nhất'],
  ];

  // Clear existing values in ranges and batch write
  const data = [
    {
      range: 'Cau_Chuyen!A1:O',
      values: [storiesHeaders, ...storiesData],
    },
    {
      range: 'Canh_Bao!A1:G',
      values: [alertsHeaders, ...alertsData],
    },
    {
      range: 'Danh_Muc!A1:E',
      values: [categoriesHeaders, ...categoriesData],
    },
    {
      range: 'Quiz!A1:J',
      values: [quizzesHeaders, ...quizzesData],
    },
    {
      range: 'Cai_Dat!A1:C',
      values: [settingsHeaders, ...settingsData],
    },
    {
      range: 'Thong_Ke!A1:C',
      values: [analyticsHeaders, ...analyticsData],
    },
  ];

  // Clear data first to ensure no leftover rows
  await Promise.all([
    sheetsFetch(`/${spreadsheetId}/values/Cau_Chuyen!A1:Z:clear`, { method: 'POST' }),
    sheetsFetch(`/${spreadsheetId}/values/Canh_Bao!A1:Z:clear`, { method: 'POST' }),
    sheetsFetch(`/${spreadsheetId}/values/Danh_Muc!A1:Z:clear`, { method: 'POST' }),
    sheetsFetch(`/${spreadsheetId}/values/Quiz!A1:Z:clear`, { method: 'POST' }),
    sheetsFetch(`/${spreadsheetId}/values/Cai_Dat!A1:Z:clear`, { method: 'POST' }),
    sheetsFetch(`/${spreadsheetId}/values/Thong_Ke!A1:Z:clear`, { method: 'POST' }),
  ]);

  // Update new values
  await sheetsFetch(`/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    }),
  });
}

/**
 * PULL (IMPORT): Download all data from Google Sheets into local store
 */
export async function pullAllDataFromSheet(spreadsheetId: string): Promise<{
  stories: Story[];
  categories: Category[];
  alerts: AlertItem[];
  quizzes: QuizQuestion[];
  settings: Partial<SystemSettings>;
  analytics: Partial<AnalyticsData>;
}> {
  const ranges = [
    'Cau_Chuyen!A2:O',
    'Canh_Bao!A2:G',
    'Danh_Muc!A2:E',
    'Quiz!A2:J',
    'Cai_Dat!A2:C',
    'Thong_Ke!A2:C',
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const result = await sheetsFetch(`/${spreadsheetId}/values:batchGet?${queryParams}`);

  const valueRanges: { range: string; values?: any[][] }[] = result.valueRanges || [];
  const getValues = (prefix: string) => {
    const vr = valueRanges.find(v => v.range.startsWith(prefix));
    return vr?.values || [];
  };

  // 1. Parse Stories
  const storiesRows = getValues('Cau_Chuyen');
  const stories: Story[] = storiesRows
    .filter(row => row && row[1]) // Must have title
    .map((row, idx) => {
      const id = row[0] || `story_${Date.now()}_${idx}`;
      const title = row[1] || '';
      const category_id = row[2] || 'cat_gia_danh';
      const risk_level: RiskLevel = (['THAP', 'TRUNG_BINH', 'CAO', 'RAT_CAO'].includes(row[3])
        ? row[3]
        : 'CAO') as RiskLevel;
      const situation = row[4] || '';
      const scam_method = row[5] || '';
      const warning_signs = row[6] ? String(row[6]).split('||').map(s => s.trim()).filter(Boolean) : [];
      const recommended_action = row[7] ? String(row[7]).split('||').map(s => s.trim()).filter(Boolean) : [];
      const lesson = row[8] || '';
      const author_name = row[9] || 'Cán bộ VietinBank';
      const status: StoryStatus = (['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'NEED_REVISION'].includes(row[10])
        ? row[10]
        : 'PUBLISHED') as StoryStatus;
      const views_count = Number(row[11]) || 0;
      const image_url = row[12] || undefined;
      const rejection_note = row[13] || undefined;
      const updated_at = row[14] || new Date().toISOString();

      return {
        id,
        title,
        category_id,
        risk_level,
        situation,
        scam_method,
        warning_signs,
        recommended_action,
        lesson,
        author_id: 'sheet_sync',
        author_name,
        status,
        views_count,
        image_url,
        rejection_note,
        created_at: updated_at,
        updated_at,
        published_at: status === 'PUBLISHED' ? updated_at : undefined,
      };
    });

  // 2. Parse Alerts
  const alertsRows = getValues('Canh_Bao');
  const alerts: AlertItem[] = alertsRows
    .filter(row => row && row[1])
    .map((row, idx) => ({
      id: row[0] || `alert_${Date.now()}_${idx}`,
      title: row[1] || '',
      content: row[2] || '',
      risk_level: (['KHAN_CAP', 'MOI', 'KHUYEN_NGHI'].includes(row[3]) ? row[3] : 'MOI') as any,
      status: row[4] === 'inactive' ? 'inactive' : 'active',
      image_url: row[5] || undefined,
      created_at: row[6] || new Date().toISOString(),
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      created_by: 'VietinBank Ninh Bình',
    }));

  // 3. Parse Categories
  const categoriesRows = getValues('Danh_Muc');
  const categories: Category[] = categoriesRows
    .filter(row => row && row[1])
    .map((row, idx) => ({
      id: row[0] || `cat_${Date.now()}_${idx}`,
      name: row[1] || '',
      icon: row[2] || 'AlertTriangle',
      description: row[3] || '',
      status: row[4] === 'inactive' ? 'inactive' : 'active',
    }));

  // 4. Parse Quizzes
  const quizzesRows = getValues('Quiz');
  const quizzes: QuizQuestion[] = quizzesRows
    .filter(row => row && row[1])
    .map((row, idx) => {
      const options = [row[2] || '', row[3] || '', row[4] || '', row[5] || ''].filter(Boolean);
      const correct = Number(row[6]);
      return {
        id: row[0] || `quiz_${Date.now()}_${idx}`,
        question: row[1] || '',
        options: options.length > 0 ? options : ['Đúng', 'Sai'],
        correct_answer: isNaN(correct) ? 0 : correct,
        explanation: row[7] || '',
        story_id: row[8] || undefined,
        status: row[9] === 'inactive' ? 'inactive' : 'active',
      };
    });

  // 5. Parse Settings
  const settingsRows = getValues('Cai_Dat');
  const settings: Partial<SystemSettings> = {};
  settingsRows.forEach(row => {
    if (row && row[0] && row[1]) {
      const key = row[0] as keyof SystemSettings;
      settings[key] = String(row[1]);
    }
  });

  // 6. Parse Analytics
  const analyticsRows = getValues('Thong_Ke');
  const analytics: Partial<AnalyticsData> = {};
  analyticsRows.forEach(row => {
    if (row && row[0]) {
      if (row[0] === 'total_views') analytics.total_views = Number(row[1]) || 0;
      if (row[0] === 'total_quizzes_taken') analytics.total_quizzes_taken = Number(row[1]) || 0;
      if (row[0] === 'total_sos_clicks') analytics.total_sos_clicks = Number(row[1]) || 0;
    }
  });

  return {
    stories,
    categories,
    alerts,
    quizzes,
    settings,
    analytics,
  };
}

/**
 * Pulls data directly from the deployed Google Apps Script Web App (JSON endpoint).
 * Allows syncing without requiring client-side Google OAuth login if deployed as "Anyone".
 */
export async function pullDataFromAppsScript(url = getAppsScriptUrl()) {
  const targetUrl = url && url.trim() ? url.trim() : DEFAULT_APPS_SCRIPT_URL;

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Máy chủ Google Apps Script trả về mã lỗi HTTP ${res.status}`);
    }

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      // If HTML was returned, Google Apps Script is asking for login / private permissions
      if (
        text.includes('You need permission') ||
        text.includes('drive.google.com') ||
        text.includes('accounts.google.com') ||
        text.includes('<html')
      ) {
        throw new Error(
          'Bản triển khai Google Apps Script hiện đang bị chặn quyền riêng tư ("You need access"). Vui lòng mở Apps Script -> Triển khai (Deploy) -> Quản lý bản triển khai (Manage deployments) -> Chọn phiên bản -> Chỉnh sửa (Edit) -> Đổi mục "Ai có quyền truy cập" (Who has access) sang "Bất kỳ ai" (Anyone) rồi nhấn Triển khai (Deploy).'
        );
      }
      throw new Error('Dữ liệu trả về từ Apps Script không đúng định dạng JSON.');
    }

    if (json.status === 'error') {
      throw new Error(json.message || 'Lỗi xử lý từ Google Apps Script.');
    }

    if (!json.data) {
      throw new Error('Không tìm thấy trường "data" trong kết quả trả về từ Apps Script.');
    }

    return json.data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error(
        'Không thể kết nối tới Google Apps Script (có thể do chặn CORS hoặc chưa đặt quyền "Bất kỳ ai"). Hãy kiểm tra lại bản Triển khai Web App trên Google Sheet.'
      );
    }
    throw err;
  }
}

