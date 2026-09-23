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

  // If sheet is completely empty, initialize header
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
  }
): Promise<void> {
  await ensureSheetTabs(spreadsheetId);

  // 1. Stories (Cau_Chuyen)
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
    'Trạng thái',
    'Lượt xem',
    'Link ảnh',
    'Ghi chú duyệt',
    'Nguồn gốc (OFFICIAL/CUSTOMER)',
    'Mã câu chuyện gốc',
    'Lượt bình chọn hữu ích',
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
    s.source_type || 'OFFICIAL',
    s.source_submission_id || '',
    s.helpful_votes || 0,
    s.updated_at,
  ]);
  await upsertSheetRows(spreadsheetId, 'Cau_Chuyen', storiesHeaders, storiesData);

  // 2. Customer Submissions (Khach_Hang_Chia_Se)
  const customerSubmissions = payload.customerSubmissions || store.getCustomerSubmissions();
  const customerHeaders = [
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
    'Số ĐT liên hệ (Nội bộ)',
    'Email liên hệ (Nội bộ)',
    'Trạng thái (PENDING_REVIEW/UNDER_REVIEW/NEED_REVISION/PUBLISHED/REJECTED)',
    'Người biên tập/duyệt',
    'Ngày duyệt',
    'Ghi chú duyệt',
    'Mã bài xuất bản',
    'Tiêu đề biên tập',
    'Tình huống biên tập',
    'Thủ đoạn biên tập',
    'Bài học biên tập',
  ];
  const customerData = customerSubmissions.map(sub => [
    sub.id,
    sub.submitted_at || sub.created_at,
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
  ]);
  await upsertSheetRows(spreadsheetId, 'Khach_Hang_Chia_Se', customerHeaders, customerData);

  // 3. Alerts (Canh_Bao)
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
  await upsertSheetRows(spreadsheetId, 'Canh_Bao', alertsHeaders, alertsData);

  // 4. Categories (Danh_Muc)
  const categoriesHeaders = ['ID', 'Tên danh mục', 'Biểu tượng (Icon)', 'Mô tả', 'Trạng thái'];
  const categoriesData = payload.categories.map(c => [
    c.id,
    c.name,
    c.icon,
    c.description,
    c.status,
  ]);
  await upsertSheetRows(spreadsheetId, 'Danh_Muc', categoriesHeaders, categoriesData);

  // 5. Quizzes (Quiz)
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
  await upsertSheetRows(spreadsheetId, 'Quiz', quizzesHeaders, quizzesData);

  // 6. Settings (Cai_Dat)
  const settingsHeaders = ['Mã tham số (Key)', 'Giá trị (Value)', 'Mô tả'];
  const settingsData = [
    ['hotline_support', payload.settings.hotline_support, 'Hotline 24/7 toàn quốc của VietinBank'],
    ['hotline_branch', payload.settings.hotline_branch, 'Số máy bàn Chi nhánh Ninh Bình'],
    ['emergency_address', payload.settings.emergency_address, 'Địa chỉ tiếp đón khách hàng khẩn cấp'],
    ['branch_name', payload.settings.branch_name, 'Tên đơn vị'],
    ['bank_name', payload.settings.bank_name, 'Ngân hàng'],
    ['security_notice', payload.settings.security_notice, 'Thông báo an toàn'],
  ];
  await upsertSheetRows(spreadsheetId, 'Cai_Dat', settingsHeaders, settingsData);

  // 7. Analytics (Thong_Ke)
  const analyticsHeaders = ['Chỉ số', 'Số lượng', 'Ý nghĩa'];
  const analyticsData = [
    ['total_views', payload.analytics.total_views, 'Tổng số lượt đọc câu chuyện cảnh giác'],
    ['total_quizzes_taken', payload.analytics.total_quizzes_taken, 'Tổng số lượt tham gia trắc nghiệm phản xạ'],
    ['total_sos_clicks', payload.analytics.total_sos_clicks, 'Số lượt bấm hỗ trợ khẩn cấp'],
    ['last_sync_time', new Date().toISOString(), 'Thời điểm đồng bộ gần nhất'],
  ];
  await upsertSheetRows(spreadsheetId, 'Thong_Ke', analyticsHeaders, analyticsData);
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
}> {
  const ranges = [
    'Cau_Chuyen!A2:R',
    'Khach_Hang_Chia_Se!A2:U',
    'Canh_Bao!A2:G',
    'Danh_Muc!A2:E',
    'Quiz!A2:J',
    'Cai_Dat!A2:C',
    'Thong_Ke!A2:C',
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
      const source_type = (row[14] === 'CUSTOMER' ? 'CUSTOMER' : 'OFFICIAL') as any;
      const source_submission_id = row[15] || undefined;
      const helpful_votes = Number(row[16]) || 0;
      const updated_at = row[17] || new Date().toISOString();

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
        source_type,
        source_submission_id,
        helpful_votes,
        created_at: updated_at,
        updated_at,
        published_at: status === 'PUBLISHED' ? updated_at : undefined,
      };
    });

  // 2. Parse Customer Submissions
  const customerRows = getValues('Khach_Hang_Chia_Se');
  const customerSubmissions: CustomerStorySubmission[] = customerRows
    .filter(row => row && row[1])
    .map((row, idx) => ({
      id: row[0] || `sub_${Date.now()}_${idx}`,
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
      created_at: row[1] || new Date().toISOString(),
      updated_at: row[14] || row[1] || new Date().toISOString(),
    }));

  // 3. Parse Alerts
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

  // 4. Parse Categories
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

  // 5. Parse Quizzes
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

  return {
    stories,
    customerSubmissions,
    categories,
    alerts,
    quizzes,
    settings,
    analytics,
  };
}

/**
 * PROCESS SYNC QUEUE: Consumes queued operations (CREATE / UPDATE / DELETE)
 * and synchronizes them to Google Sheets using Upsert semantics.
 */
export async function processSyncQueue(spreadsheetId?: string): Promise<{
  processedCount: number;
  remainingCount: number;
}> {
  const targetSheetId = spreadsheetId || getStoredSheetConfig()?.spreadsheetId;
  const queue = store.getSyncQueue();

  if (queue.length === 0) {
    return { processedCount: 0, remainingCount: 0 };
  }

  // If Google Sheets is configured, push queue items
  if (targetSheetId) {
    await ensureSheetTabs(targetSheetId);

    // Group items by entity to process efficiently
    for (const item of queue) {
      try {
        if (item.entity_type === 'STORY' && item.payload) {
          const s = item.payload as Story;
          const row = [
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
            s.source_type || 'OFFICIAL',
            s.source_submission_id || '',
            s.helpful_votes || 0,
            s.updated_at,
          ];
          await upsertSheetRows(targetSheetId, 'Cau_Chuyen', [], [row]);
        } else if (item.entity_type === 'CUSTOMER_SUBMISSION' && item.payload) {
          const sub = item.payload as CustomerStorySubmission;
          const row = [
            sub.id,
            sub.submitted_at || sub.created_at,
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
          ];
          await upsertSheetRows(targetSheetId, 'Khach_Hang_Chia_Se', [], [row]);
        } else if (item.entity_type === 'ALERT' && item.payload) {
          const a = item.payload as AlertItem;
          const row = [a.id, a.title, a.content, a.risk_level, a.status, a.image_url || '', a.created_at];
          await upsertSheetRows(targetSheetId, 'Canh_Bao', [], [row]);
        }

        // Mark item as synced
        store.markQueueItemSynced(item.id);
      } catch (err) {
        console.warn(`Could not sync item ${item.id} to sheet:`, err);
        // Leave item in queue to retry next time
      }
    }
  }

  // Also try syncing to Google Apps Script Web App endpoint if available
  const appsScriptUrl = getAppsScriptUrl();
  if (appsScriptUrl && appsScriptUrl !== DEFAULT_APPS_SCRIPT_URL) {
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SYNC_QUEUE',
          items: queue,
        }),
      }).catch(() => {});
    } catch {}
  }

  const remaining = store.getSyncQueue().length;
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
