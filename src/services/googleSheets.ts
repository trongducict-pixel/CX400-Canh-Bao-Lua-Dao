import { getAccessToken } from './googleAuth';
import {
  AlertItem,
  AnalyticsData,
  Category,
  CustomerStorySubmission,
  QuizQuestion,
  RiskLevel,
  Story,
  StoryStatus,
  SyncQueueItem,
  SystemSettings,
  AuditLog,
  QuizResultLog,
} from '../types';
import { store } from './store';

export interface SheetSyncSummary {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt: string;
  storiesCount: number;
  customerSubmissionsCount: number;
  categoriesCount: number;
  alertsCount: number;
  quizzesCount: number;
  quizResultsCount: number;
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
 * Required Sheet Tabs in the Central Business Database
 */
export const REQUIRED_SHEETS = [
  'Cau_Chuyen',
  'Khach_Hang_Chia_Se',
  'Canh_Bao',
  'Danh_Muc',
  'Quiz',
  'Cai_Dat',
  'Thong_Ke',
  'Nhat_Ky_Audit',
  'Ket_Qua_Quiz',
];

/**
 * ==============================================================================
 * UNIFORM SERIALIZATION & PARSING FUNCTIONS (SECTION XX, XXII, XXIII)
 * Symmetrical row mapping for both PUSH and SYNC QUEUE operations
 * ==============================================================================
 */

export const SHEET_HEADERS = {
  Cau_Chuyen: [
    'ID',
    'Tiêu đề',
    'Mã danh mục',
    'Mức độ rủi ro',
    'Tình huống',
    'Thủ đoạn lừa đảo',
    'Dấu hiệu cảnh báo (phân cách bởi ||)',
    'Hành động khuyến nghị (phân cách bởi ||)',
    'Bài học ghi nhớ',
    'Author_ID',
    'Author_Name',
    'Trạng thái',
    'Lượt xem',
    'Link ảnh',
    'Ghi chú duyệt',
    'Nguồn gốc (OFFICIAL/CUSTOMER)',
    'Mã câu chuyện gốc',
    'Lượt hữu ích',
    'Created_At',
    'Updated_At',
    'Submitted_At',
    'Approved_By',
    'Approved_At',
    'Published_At',
  ],
  Khach_Hang_Chia_Se: [
    'ID',
    'Ngày gửi',
    'Tiêu đề gốc',
    'Nội dung câu chuyện',
    'Kẻ lừa đảo đã làm gì',
    'Khách hàng đã xử lý',
    'Lời nhắn nhủ cộng đồng',
    'Mã nhóm chiêu trò',
    'Chia sẻ ẩn danh (TRUE/FALSE)',
    'Tên hiển thị',
    'Số ĐT liên hệ',
    'Email liên hệ',
    'Trạng thái (PENDING_REVIEW/UNDER_REVIEW/NEED_REVISION/PUBLISHED/REJECTED)',
    'Người biên tập/duyệt',
    'Ngày duyệt',
    'Ghi chú duyệt',
    'Mã bài xuất bản',
    'Tiêu đề biên tập',
    'Tình huống biên tập',
    'Thủ đoạn biên tập',
    'Bài học biên tập',
    'Created_At',
    'Updated_At',
  ],
  Canh_Bao: [
    'ID',
    'Tiêu đề',
    'Nội dung chi tiết',
    'Mức độ rủi ro (KHAN_CAP/MOI/KHUYEN_NGHI)',
    'Trạng thái (active/inactive)',
    'Link ảnh',
    'Ngày tạo',
  ],
  Danh_Muc: ['ID', 'Tên danh mục', 'Biểu tượng (Icon)', 'Mô tả', 'Trạng thái'],
  Quiz: [
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
  ],
  Cai_Dat: ['Mã tham số (Key)', 'Giá trị (Value)', 'Mô tả'],
  Thong_Ke: ['Chỉ số', 'Số lượng', 'Ý nghĩa'],
  Nhat_Ky_Audit: [
    'ID',
    'Thời gian',
    'User ID',
    'Tên người thao tác',
    'Vai trò',
    'Hành động',
    'Loại đối tượng',
    'ID đối tượng',
    'Mô tả chi tiết',
    'Trạng thái cũ',
    'Trạng thái mới',
  ],
  Ket_Qua_Quiz: [
    'ID',
    'Quiz_ID',
    'Story_ID',
    'Tổng số câu',
    'Số câu đúng',
    'Tỷ lệ (%)',
    'Session_ID',
    'Thời gian hoàn thành',
  ],
};

export function storyToSheetRow(s: Story): (string | number)[] {
  return [
    s.id,
    s.title,
    s.category_id,
    s.risk_level,
    s.situation,
    s.scam_method,
    (s.warning_signs || []).join(' || '),
    (s.recommended_action || []).join(' || '),
    s.lesson,
    s.author_id || 'cbo_vietinbank',
    s.author_name || 'Cán bộ VietinBank',
    s.status,
    s.views_count || 0,
    s.image_url || '',
    s.rejection_note || '',
    s.source_type || 'OFFICIAL',
    s.source_submission_id || '',
    s.helpful_votes || 0,
    s.created_at || s.updated_at || new Date().toISOString(),
    s.updated_at || new Date().toISOString(),
    s.submitted_at || '',
    s.approved_by || '',
    s.approved_at || '',
    s.published_at || (s.status === 'PUBLISHED' ? s.updated_at || '' : ''),
  ];
}

export function rowToStory(row: any[]): Story {
  const id = row[0] || `story_${Date.now()}`;
  const title = row[1] || '';
  const category_id = row[2] || 'cat_gia_danh';
  const risk_level: RiskLevel = ['THAP', 'TRUNG_BINH', 'CAO', 'RAT_CAO'].includes(row[3])
    ? (row[3] as RiskLevel)
    : 'CAO';
  const situation = row[4] || '';
  const scam_method = row[5] || '';
  const warning_signs = row[6] ? String(row[6]).split('||').map(s => s.trim()).filter(Boolean) : [];
  const recommended_action = row[7] ? String(row[7]).split('||').map(s => s.trim()).filter(Boolean) : [];
  const lesson = row[8] || '';

  // Preserve original author_id if present; fallback to standard identifier
  const author_id = row[9] && String(row[9]).trim() ? String(row[9]).trim() : 'cbo_vietinbank';
  const author_name = row[10] || 'Cán bộ VietinBank';
  const status: StoryStatus = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'NEED_REVISION'].includes(row[11])
    ? (row[11] as StoryStatus)
    : 'PUBLISHED';
  const views_count = Number(row[12]) || 0;
  const image_url = row[13] || undefined;
  const rejection_note = row[14] || undefined;
  const source_type = (row[15] === 'CUSTOMER' ? 'CUSTOMER' : 'OFFICIAL') as any;
  const source_submission_id = row[16] || undefined;
  const helpful_votes = Number(row[17]) || 0;

  // Preserve original timestamps without flattening created_at to updated_at
  const created_at = row[18] || row[19] || new Date().toISOString();
  const updated_at = row[19] || row[18] || new Date().toISOString();
  const submitted_at = row[20] || undefined;
  const approved_by = row[21] || undefined;
  const approved_at = row[22] || undefined;
  const published_at = row[23] || (status === 'PUBLISHED' ? updated_at : undefined);

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
    author_id,
    author_name,
    status,
    views_count,
    image_url,
    rejection_note,
    source_type,
    source_submission_id,
    helpful_votes,
    created_at,
    updated_at,
    submitted_at,
    approved_by,
    approved_at,
    published_at,
  };
}

export function customerSubmissionToSheetRow(sub: CustomerStorySubmission): (string | number)[] {
  return [
    sub.id,
    sub.submitted_at || sub.created_at || new Date().toISOString(),
    sub.raw_title,
    sub.raw_content,
    sub.scam_method || '',
    sub.customer_action || '',
    sub.customer_lesson || '',
    sub.category_id,
    sub.is_anonymous ? 'TRUE' : 'FALSE',
    sub.display_name || '',
    sub.contact_phone || '',
    sub.contact_email || '',
    sub.status,
    sub.reviewed_by || '',
    sub.reviewed_at || '',
    sub.review_note || '',
    sub.published_story_id || '',
    sub.edited_title || '',
    sub.edited_situation || '',
    sub.edited_scam_method || '',
    sub.edited_lesson || '',
    sub.created_at || sub.submitted_at || new Date().toISOString(),
    sub.updated_at || sub.reviewed_at || sub.submitted_at || new Date().toISOString(),
  ];
}

export function rowToCustomerSubmission(row: any[]): CustomerStorySubmission {
  return {
    id: row[0] || `sub_${Date.now()}`,
    submitted_at: row[1] || new Date().toISOString(),
    raw_title: row[2] || 'Chiêu trò lừa đảo qua mạng',
    raw_content: row[3] || '',
    risk_level: 'CAO' as RiskLevel,
    scam_method: row[4] || undefined,
    customer_action: row[5] || undefined,
    customer_lesson: row[6] || undefined,
    category_id: row[7] || 'cat_congan',
    is_anonymous: String(row[8]).toUpperCase() === 'TRUE',
    display_name: row[9] || undefined,
    contact_phone: row[10] || undefined,
    contact_email: row[11] || undefined,
    status: (['PENDING_REVIEW', 'UNDER_REVIEW', 'NEED_REVISION', 'PUBLISHED', 'REJECTED'].includes(row[12])
      ? row[12]
      : 'PENDING_REVIEW') as any,
    reviewed_by: row[13] || undefined,
    reviewed_at: row[14] || undefined,
    review_note: row[15] || undefined,
    published_story_id: row[16] || undefined,
    edited_title: row[17] || undefined,
    edited_situation: row[18] || undefined,
    edited_scam_method: row[19] || undefined,
    edited_lesson: row[20] || undefined,
    created_at: row[21] || row[1] || new Date().toISOString(),
    updated_at: row[22] || row[14] || row[1] || new Date().toISOString(),
  };
}

export function alertToSheetRow(a: AlertItem): string[] {
  return [a.id, a.title, a.content, a.risk_level, a.status, a.image_url || '', a.created_at];
}

export function rowToAlert(row: any[]): AlertItem {
  const createdAt = row[6] || new Date().toISOString();
  return {
    id: row[0] || `alert_${Date.now()}`,
    title: row[1] || '',
    content: row[2] || '',
    risk_level: row[3] || 'KHAN_CAP',
    status: row[4] === 'inactive' ? 'inactive' : 'active',
    image_url: row[5] || undefined,
    start_date: row[7] || createdAt,
    end_date: row[8] || '',
    created_by: row[9] || 'cbo_vietinbank',
    created_at: createdAt,
  };
}

export function categoryToSheetRow(c: Category): string[] {
  return [c.id, c.name, c.icon, c.description, c.status];
}

export function rowToCategory(row: any[]): Category {
  return {
    id: row[0] || `cat_${Date.now()}`,
    name: row[1] || '',
    icon: row[2] || 'AlertTriangle',
    description: row[3] || '',
    status: row[4] === 'inactive' ? 'inactive' : 'active',
  };
}

export function quizToSheetRow(q: QuizQuestion): (string | number)[] {
  return [
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
  ];
}

export function rowToQuiz(row: any[]): QuizQuestion {
  return {
    id: row[0] || `quiz_${Date.now()}`,
    question: row[1] || '',
    options: [row[2], row[3], row[4], row[5]].filter(Boolean),
    correct_answer: Number(row[6]) || 0,
    explanation: row[7] || '',
    story_id: row[8] || undefined,
    status: row[9] === 'inactive' ? 'inactive' : 'active',
  };
}

export function settingsToSheetRows(settings: SystemSettings): (string | number)[][] {
  return [
    ['hotline_support', settings.hotline_support, 'Hotline 24/7 toàn quốc của VietinBank'],
    ['hotline_branch', settings.hotline_branch, 'Số máy bàn Chi nhánh Ninh Bình'],
    ['emergency_address', settings.emergency_address, 'Địa chỉ tiếp đón khách hàng khẩn cấp'],
    ['branch_name', settings.branch_name, 'Tên đơn vị'],
    ['bank_name', settings.bank_name, 'Ngân hàng'],
    ['security_notice', settings.security_notice, 'Thông báo an toàn'],
  ];
}

export function auditToSheetRow(log: AuditLog): string[] {
  return [
    log.id,
    log.timestamp,
    log.user_id,
    log.user_name,
    log.role,
    log.action,
    log.entity_type,
    log.entity_id,
    log.description,
    log.old_status || '',
    log.new_status || '',
  ];
}

export function rowToAudit(row: any[]): AuditLog {
  return {
    id: row[0] || `audit_${Date.now()}`,
    timestamp: row[1] || new Date().toISOString(),
    user_id: row[2] || '',
    user_name: row[3] || '',
    role: row[4] || 'STAFF',
    action: row[5] || '',
    entity_type: row[6] || '',
    entity_id: row[7] || '',
    description: row[8] || '',
    old_status: row[9] || undefined,
    new_status: row[10] || undefined,
  };
}

export function quizResultToSheetRow(r: QuizResultLog): (string | number)[] {
  return [
    r.id,
    r.quiz_id || '',
    r.story_id || '',
    r.total_questions,
    r.correct_count,
    Math.round(r.score_ratio * 100),
    r.session_id,
    r.timestamp,
  ];
}

export function rowToQuizResult(row: any[]): QuizResultLog {
  const total = Number(row[3]) || 5;
  const correct = Number(row[4]) || 0;
  return {
    id: row[0] || `qres_${Date.now()}`,
    quiz_id: row[1] || undefined,
    story_id: row[2] || undefined,
    total_questions: total,
    correct_count: correct,
    score_ratio: total > 0 ? correct / total : 0,
    session_id: row[6] || `session_${Date.now()}`,
    timestamp: row[7] || new Date().toISOString(),
  };
}

/**
 * Ensures required sheet tabs exist in an existing Google Spreadsheet
 */
export async function ensureSheetTabs(spreadsheetId: string) {
  const meta = await sheetsFetch(`/${spreadsheetId}?fields=sheets.properties.title`);
  const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

  const missing = REQUIRED_SHEETS.filter(t => !existingTitles.includes(t));

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
 * Helper: Upsert rows into a sheet tab based on Column 0 (ID).
 * If row with ID exists: Updates that exact row.
 * If row does not exist: Appends to the bottom.
 * Preserves other rows (NEVER wipes the whole sheet!).
 */
async function upsertSheetRows(
  spreadsheetId: string,
  sheetTitle: string,
  headerRow: string[],
  rowsData: (string | number | boolean)[][]
) {
  // 1. Fetch existing rows to map IDs
  const res = await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:Z`).catch(() => ({}));
  const existingValues: any[][] = res.values || [];

  // If sheet is completely empty, initialize header + data
  if (existingValues.length === 0) {
    await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        values: [headerRow, ...rowsData],
      }),
    });
    return;
  }

  // Ensure header row is at row 1
  const currentHeader = existingValues[0];
  if (!currentHeader || currentHeader.length === 0) {
    await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [headerRow] }),
    });
  }

  // Build index map: id -> 1-based row number
  const idToRowIndex = new Map<string, number>();
  for (let r = 1; r < existingValues.length; r++) {
    const rowId = existingValues[r]?.[0];
    if (rowId) {
      idToRowIndex.set(String(rowId).trim(), r + 1); // 1-indexed for Sheet range
    }
  }

  const updateRequests: { range: string; values: any[][] }[] = [];
  const appendRows: any[][] = [];

  for (const row of rowsData) {
    const id = String(row[0]).trim();
    if (idToRowIndex.has(id)) {
      const rowNum = idToRowIndex.get(id)!;
      updateRequests.push({
        range: `${sheetTitle}!A${rowNum}`,
        values: [row],
      });
    } else {
      appendRows.push(row);
    }
  }

  // Execute updates
  if (updateRequests.length > 0) {
    await sheetsFetch(`/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updateRequests,
      }),
    });
  }

  // Execute appends
  if (appendRows.length > 0) {
    await sheetsFetch(`/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({
        values: appendRows,
      }),
    });
  }
}

/**
 * PUSH (EXPORT): Upsert local app state up to Google Sheets without wiping existing data!
 */
export async function pushAllDataToSheet(
  spreadsheetId: string,
  payload: {
    stories: Story[];
    customerSubmissions?: CustomerStorySubmission[];
    categories: Category[];
    alerts: AlertItem[];
    quizzes: QuizQuestion[];
    settings: SystemSettings;
    analytics: AnalyticsData;
    quizResults?: QuizResultLog[];
    auditLogs?: AuditLog[];
  }
): Promise<void> {
  console.groupCollapsed('[CX400 SYNC] Bắt đầu đẩy dữ liệu (PUSH) lên Google Sheets');
  try {
    await ensureSheetTabs(spreadsheetId);

    // 1. Stories (Cau_Chuyen)
    const storiesData = payload.stories.map(s => storyToSheetRow(s));
    await upsertSheetRows(spreadsheetId, 'Cau_Chuyen', SHEET_HEADERS.Cau_Chuyen, storiesData);

    // 2. Customer Submissions (Khach_Hang_Chia_Se)
    const customerSubmissions = payload.customerSubmissions || store.getCustomerSubmissions();
    const customerData = customerSubmissions.map(sub => customerSubmissionToSheetRow(sub));
    await upsertSheetRows(spreadsheetId, 'Khach_Hang_Chia_Se', SHEET_HEADERS.Khach_Hang_Chia_Se, customerData);

    // 3. Alerts (Canh_Bao)
    const alertsData = payload.alerts.map(a => alertToSheetRow(a));
    await upsertSheetRows(spreadsheetId, 'Canh_Bao', SHEET_HEADERS.Canh_Bao, alertsData);

    // 4. Categories (Danh_Muc)
    const categoriesData = payload.categories.map(c => categoryToSheetRow(c));
    await upsertSheetRows(spreadsheetId, 'Danh_Muc', SHEET_HEADERS.Danh_Muc, categoriesData);

    // 5. Quizzes (Quiz)
    const quizzesData = payload.quizzes.map(q => quizToSheetRow(q));
    await upsertSheetRows(spreadsheetId, 'Quiz', SHEET_HEADERS.Quiz, quizzesData);

    // 6. Settings (Cai_Dat)
    const settingsData = settingsToSheetRows(payload.settings);
    await upsertSheetRows(spreadsheetId, 'Cai_Dat', SHEET_HEADERS.Cai_Dat, settingsData);

    // 7. Analytics (Thong_Ke)
    const analyticsData = [
      ['total_views', payload.analytics.total_views, 'Tổng số lượt đọc câu chuyện cảnh giác'],
      ['total_quizzes_taken', payload.analytics.total_quizzes_taken, 'Tổng số lượt tham gia trắc nghiệm phản xạ'],
      ['total_sos_clicks', payload.analytics.total_sos_clicks, 'Số lượt bấm hỗ trợ khẩn cấp'],
      ['last_sync_time', new Date().toISOString(), 'Thời điểm đồng bộ gần nhất'],
    ];
    await upsertSheetRows(spreadsheetId, 'Thong_Ke', SHEET_HEADERS.Thong_Ke, analyticsData);

    // 8. Quiz Results (Ket_Qua_Quiz)
    const quizResults = payload.quizResults || store.getQuizResults();
    if (quizResults.length > 0) {
      const quizResData = quizResults.map(r => quizResultToSheetRow(r));
      await upsertSheetRows(spreadsheetId, 'Ket_Qua_Quiz', SHEET_HEADERS.Ket_Qua_Quiz, quizResData);
    }

    // 9. Audit Logs (Nhat_Ky_Audit)
    const auditLogs = payload.auditLogs || store.getAuditLogs();
    if (auditLogs.length > 0) {
      const auditData = auditLogs.slice(0, 100).map(a => auditToSheetRow(a));
      await upsertSheetRows(spreadsheetId, 'Nhat_Ky_Audit', SHEET_HEADERS.Nhat_Ky_Audit, auditData);
    }

    console.log('[CX400 SYNC] PUSH thành công toàn bộ thực thể lên Google Sheets.');
  } finally {
    console.groupEnd();
  }
}

/**
 * PULL (IMPORT): Download all data from Google Sheets into local store (Upsert by ID)
 */
export async function pullAllDataFromSheet(spreadsheetId: string): Promise<{
  stories: Story[];
  customerSubmissions?: CustomerStorySubmission[];
  categories: Category[];
  alerts: AlertItem[];
  quizzes: QuizQuestion[];
  settings: Partial<SystemSettings>;
  analytics: Partial<AnalyticsData>;
  quizResults?: QuizResultLog[];
  auditLogs?: AuditLog[];
}> {
  console.groupCollapsed('[CX400 SYNC] Bắt đầu tải dữ liệu (PULL) từ Google Sheets');
  try {
    const ranges = [
      'Cau_Chuyen!A2:X',
      'Khach_Hang_Chia_Se!A2:W',
      'Canh_Bao!A2:G',
      'Danh_Muc!A2:E',
      'Quiz!A2:J',
      'Cai_Dat!A2:C',
      'Thong_Ke!A2:C',
      'Ket_Qua_Quiz!A2:H',
      'Nhat_Ky_Audit!A2:K',
    ];

    const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const result = await sheetsFetch(`/${spreadsheetId}/values:batchGet?${queryParams}`).catch(() => ({}));

    const valueRanges: { range: string; values?: any[][] }[] = result.valueRanges || [];
    const getValues = (prefix: string) => {
      const vr = valueRanges.find(v => v.range.startsWith(prefix));
      return vr?.values || [];
    };

    // 1. Parse Stories
    const storiesRows = getValues('Cau_Chuyen');
    const stories: Story[] = storiesRows
      .filter(row => row && row[1])
      .map(row => rowToStory(row));

    // 2. Parse Customer Submissions
    const customerRows = getValues('Khach_Hang_Chia_Se');
    const customerSubmissions: CustomerStorySubmission[] = customerRows
      .filter(row => row && row[2])
      .map(row => rowToCustomerSubmission(row));

    // 3. Parse Alerts
    const alertsRows = getValues('Canh_Bao');
    const alerts: AlertItem[] = alertsRows
      .filter(row => row && row[1])
      .map(row => rowToAlert(row));

    // 4. Parse Categories
    const categoriesRows = getValues('Danh_Muc');
    const categories: Category[] = categoriesRows
      .filter(row => row && row[1])
      .map(row => rowToCategory(row));

    // 5. Parse Quizzes
    const quizzesRows = getValues('Quiz');
    const quizzes: QuizQuestion[] = quizzesRows
      .filter(row => row && row[1])
      .map(row => rowToQuiz(row));

    // 6. Parse Settings
    const settingsRows = getValues('Cai_Dat');
    const settings: Partial<SystemSettings> = {};
    settingsRows.forEach(row => {
      if (row && row[0] && row[1]) {
        const key = row[0] as keyof SystemSettings;
        settings[key] = String(row[1]) as any;
      }
    });

    // 7. Parse Analytics
    const analyticsRows = getValues('Thong_Ke');
    const analytics: Partial<AnalyticsData> = {};
    analyticsRows.forEach(row => {
      if (row && row[0]) {
        if (row[0] === 'total_views') analytics.total_views = Number(row[1]) || 0;
        if (row[0] === 'total_quizzes_taken') analytics.total_quizzes_taken = Number(row[1]) || 0;
        if (row[0] === 'total_sos_clicks') analytics.total_sos_clicks = Number(row[1]) || 0;
      }
    });

    // 8. Parse Quiz Results
    const quizResultsRows = getValues('Ket_Qua_Quiz');
    const quizResults: QuizResultLog[] = quizResultsRows
      .filter(row => row && row[0])
      .map(row => rowToQuizResult(row));

    // 9. Parse Audit Logs
    const auditRows = getValues('Nhat_Ky_Audit');
    const auditLogs: AuditLog[] = auditRows
      .filter(row => row && row[0])
      .map(row => rowToAudit(row));

    console.log(
      `[CX400 SYNC] PULL hoàn tất: ${stories.length} tình huống, ${customerSubmissions.length} câu chuyện KH, ${quizResults.length} kết quả quiz.`
    );

    return {
      stories,
      customerSubmissions,
      categories,
      alerts,
      quizzes,
      settings,
      analytics,
      quizResults,
      auditLogs,
    };
  } finally {
    console.groupEnd();
  }
}

/**
 * PROCESS SYNC QUEUE: Consumes queued operations (CREATE / UPDATE / DELETE)
 * and synchronizes them to Google Sheets using Apps Script Web App or Sheets API.
 */
export async function processSyncQueue(spreadsheetId?: string): Promise<{
  processedCount: number;
  remainingCount: number;
}> {
  const queue = store.getSyncQueue();
  if (queue.length === 0) {
    return { processedCount: 0, remainingCount: 0 };
  }

  console.groupCollapsed(`[CX400 SYNC] Xử lý hàng đợi đồng bộ (${queue.length} tác vụ)`);

  const appsScriptUrl = getAppsScriptUrl();
  let processedByAppsScript = false;

  // PRIORITY 1: Push via Google Apps Script Web App
  if (appsScriptUrl && appsScriptUrl.trim()) {
    try {
      console.log('[CX400 SYNC] Đang gửi hàng đợi tới Google Apps Script Web App...');
      const res = await fetch(appsScriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SYNC_QUEUE',
          items: queue,
        }),
      });

      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.status === 'success') {
            console.log('[CX400 SYNC] Apps Script xử lý thành công hàng đợi:', json.processed || queue.length);
            // Mark items as synced
            queue.forEach(q => store.markQueueItemSynced(q.id));
            processedByAppsScript = true;
          }
        } catch {
          // If non-json or blocked
        }
      }
    } catch (err) {
      console.warn('[CX400 SYNC] Không thể gửi tới Apps Script Web App, thử fallback Sheets API:', err);
    }
  }

  // PRIORITY 2: If Apps Script did not process and Direct Sheets API is configured
  const targetSheetId = spreadsheetId || getStoredSheetConfig()?.spreadsheetId;
  if (!processedByAppsScript && targetSheetId) {
    try {
      await ensureSheetTabs(targetSheetId);

      for (const item of queue) {
        try {
          const entityType = (item as any).entity_type || (item as any).entity;

          if (entityType === 'QUIZ_RESULT' && item.payload) {
            const row = quizResultToSheetRow(item.payload as QuizResultLog);
            await upsertSheetRows(targetSheetId, 'Ket_Qua_Quiz', SHEET_HEADERS.Ket_Qua_Quiz, [row]);
          } else if (entityType === 'AUDIT' && item.payload) {
            const row = auditToSheetRow(item.payload as AuditLog);
            await upsertSheetRows(targetSheetId, 'Nhat_Ky_Audit', SHEET_HEADERS.Nhat_Ky_Audit, [row]);
          } else if (entityType === 'STORY' && item.payload) {
            const row = storyToSheetRow(item.payload as Story);
            await upsertSheetRows(targetSheetId, 'Cau_Chuyen', SHEET_HEADERS.Cau_Chuyen, [row]);
          } else if (entityType === 'CUSTOMER_SUBMISSION' && item.payload) {
            const row = customerSubmissionToSheetRow(item.payload as CustomerStorySubmission);
            await upsertSheetRows(targetSheetId, 'Khach_Hang_Chia_Se', SHEET_HEADERS.Khach_Hang_Chia_Se, [row]);
          } else if (entityType === 'ALERT' && item.payload) {
            const row = alertToSheetRow(item.payload as AlertItem);
            await upsertSheetRows(targetSheetId, 'Canh_Bao', SHEET_HEADERS.Canh_Bao, [row]);
          } else if (entityType === 'CATEGORY' && item.payload) {
            const row = categoryToSheetRow(item.payload as Category);
            await upsertSheetRows(targetSheetId, 'Danh_Muc', SHEET_HEADERS.Danh_Muc, [row]);
          } else if (entityType === 'QUIZ' && item.payload) {
            const row = quizToSheetRow(item.payload as QuizQuestion);
            await upsertSheetRows(targetSheetId, 'Quiz', SHEET_HEADERS.Quiz, [row]);
          } else if (entityType === 'SETTINGS' && item.payload) {
            const rows = settingsToSheetRows(item.payload as SystemSettings);
            await upsertSheetRows(targetSheetId, 'Cai_Dat', SHEET_HEADERS.Cai_Dat, rows);
          }

          store.markQueueItemSynced(item.id);
        } catch (itemErr: any) {
          console.warn(`[CX400 SYNC] Lỗi đồng bộ item ${item.id}:`, itemErr);
          store.markQueueItemFailed(item.id, itemErr.message || String(itemErr));
        }
      }
    } catch (generalErr) {
      console.warn('[CX400 SYNC] Lỗi chung khi xử lý hàng đợi qua Sheets API:', generalErr);
    }
  }

  const remaining = store.getSyncQueue().length;
  console.log(`[CX400 SYNC] Hoàn tất hàng đợi. Còn lại: ${remaining} bản ghi.`);
  console.groupEnd();

  return {
    processedCount: queue.length - remaining,
    remainingCount: remaining,
  };
}

/**
 * Pulls data directly from the deployed Google Apps Script Web App (JSON endpoint).
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
      if (
        text.includes('You need permission') ||
        text.includes('drive.google.com') ||
        text.includes('accounts.google.com') ||
        text.includes('<html')
      ) {
        throw new Error(
          'Bản triển khai Google Apps Script hiện đang bị chặn quyền riêng tư ("You need access"). Vui lòng mở Apps Script -> Triển khai (Deploy) -> Quản lý bản triển khai (Manage deployments) -> Đổi quyền truy cập sang "Bất kỳ ai" (Anyone).'
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
    sheets: REQUIRED_SHEETS.map(sheetTitle => ({
      properties: {
        title: sheetTitle,
        gridProperties: { frozenRowCount: 1 },
      },
    })),
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
