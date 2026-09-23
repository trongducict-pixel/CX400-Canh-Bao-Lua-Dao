export const GOOGLE_APPS_SCRIPT_CODE_RAW = `/**
 * ==============================================================================
 * DỰ ÁN: CX400 – TRUYỀN THÔNG CẢNH GIÁC LỪA ĐẢO
 * ĐƠN VỊ: CHI NHÁNH VIETINBANK NINH BÌNH - PHÒNG DỊCH VỤ KHÁCH HÀNG (DVKH)
 * GOOGLE APPS SCRIPT CHO GOOGLE SPREADSHEET (KHO DỮ LIỆU NGHIỆP VỤ TRUNG TÂM)
 * ==============================================================================
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở file Google Sheet của bạn.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết code mặc định trong file Code.gs và dán toàn bộ đoạn mã bên dưới vào.
 * 4. Nhấn nút "Lưu dự án" (biểu tượng đĩa mềm 💾 hoặc Ctrl + S).
 * 5. Nhấn "Triển khai" (Deploy) -> "Bản triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app)
 *    - Người thực thi: "Tôi" (Me)
 *    - Người có quyền truy cập: "Bất kỳ ai" (Anyone)
 * 6. Sao chép URL Web App vừa tạo và dán vào ứng dụng CX400.
 * ==============================================================================
 */

// Màu sắc nhận diện thương hiệu VietinBank
const BRAND_COLORS = {
  PRIMARY: '#004B87',       // Xanh VietinBank Primary
  SECONDARY: '#D32F2F',     // Đỏ cảnh báo / điểm nhấn
  HEADER_BG: '#003B70',     // Nền tiêu đề cột
  HEADER_TEXT: '#FFFFFF',   // Chữ tiêu đề
  ROW_EVEN: '#F4F8FC',      // Dòng chẵn xen kẽ
  ROW_ODD: '#FFFFFF',       // Dòng lẻ
  BORDER: '#D0DCE5',        // Đường viền ô
};

const SHEET_NAMES = [
  'Cau_Chuyen',
  'Khach_Hang_Chia_Se',
  'Canh_Bao',
  'Danh_Muc',
  'Quiz',
  'Cai_Dat',
  'Thong_Ke',
  'Nhat_Ky_Audit',
  'Ket_Qua_Quiz'
];

/**
 * Tự động tạo menu khi mở bảng tính
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛡️ VIETINBANK CX400')
    .addItem('🎨 Định dạng bảng chuẩn VietinBank', 'formatAllSheets')
    .addItem('🔍 Kiểm tra tính hợp lệ dữ liệu', 'validateAllData')
    .addSeparator()
    .addItem('➕ Thêm tình huống lừa đảo mẫu', 'addNewStoryTemplate')
    .addItem('➕ Thêm cảnh báo khẩn cấp mẫu', 'addNewAlertTemplate')
    .addItem('➕ Thêm câu hỏi trắc nghiệm mẫu', 'addNewQuizTemplate')
    .addSeparator()
    .addItem('🔄 Cập nhật thời điểm đồng bộ', 'updateLastSyncTime')
    .addItem('📖 Hướng dẫn sử dụng cho Cán bộ DVKH', 'showUserGuide')
    .addToUi();
}

/**
 * 1. ĐỊNH DẠNG TOÀN BỘ CÁC BẢNG CHUẨN ĐẸP, DỄ ĐỌC
 */
function formatAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  SHEET_NAMES.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    
    // Cố định dòng tiêu đề đầu tiên
    sheet.setFrozenRows(1);
    
    const lastRow = Math.max(sheet.getLastRow(), 1);
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    
    // Định dạng dòng tiêu đề (Header)
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange.setBackground(BRAND_COLORS.HEADER_BG)
               .setFontColor(BRAND_COLORS.HEADER_TEXT)
               .setFontWeight('bold')
               .setFontSize(10)
               .setFontFamily('Arial')
               .setHorizontalAlignment('center')
               .setVerticalAlignment('middle')
               .setWrap(true);
    sheet.setRowHeight(1, 38);
    
    // Định dạng dữ liệu nếu có
    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      dataRange.setFontFamily('Arial')
               .setFontSize(10)
               .setVerticalAlignment('middle')
               .setBorder(true, true, true, true, true, true, BRAND_COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID);
      
      // Kẻ màu dòng xen kẽ (Zebra striping)
      for (let r = 2; r <= lastRow; r++) {
        const rowRange = sheet.getRange(r, 1, 1, lastCol);
        if (r % 2 === 0) {
          rowRange.setBackground(BRAND_COLORS.ROW_EVEN);
        } else {
          rowRange.setBackground(BRAND_COLORS.ROW_ODD);
        }
      }
    }
  });

  SpreadsheetApp.getUi().alert('✅ Đã định dạng thành công toàn bộ bảng theo nhận diện thương hiệu VietinBank!');
}

/**
 * 2. KIỂM TRA HỢP LỆ DỮ LIỆU
 */
function validateAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errors = [];
  
  const storySheet = ss.getSheetByName('Cau_Chuyen');
  if (storySheet && storySheet.getLastRow() > 1) {
    const data = storySheet.getRange(2, 1, storySheet.getLastRow() - 1, 12).getValues();
    data.forEach((row, idx) => {
      const rowNum = idx + 2;
      if (!row[0]) errors.push(\`[Cau_Chuyen] Dòng \${rowNum}: Thiếu mã ID.\`);
      if (!row[1]) errors.push(\`[Cau_Chuyen] Dòng \${rowNum}: Thiếu tiêu đề tình huống.\`);
    });
  }

  const ui = SpreadsheetApp.getUi();
  if (errors.length === 0) {
    ui.alert('🎉 Dữ liệu hoàn toàn hợp lệ! Không phát hiện lỗi cấu trúc.');
  } else {
    ui.alert('⚠️ Phát hiện ' + errors.length + ' vấn đề:\\n\\n' + errors.slice(0, 10).join('\\n'));
  }
}

/**
 * Helper: Upsert row by ID into any sheet
 */
function upsertRowInSheet(sheet, id, rowValues) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.appendRow(rowValues);
    return;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) {
      sheet.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues]);
      return;
    }
  }

  sheet.appendRow(rowValues);
}

/**
 * Helper: Upsert key-value in Cai_Dat
 */
function upsertSetting(sheet, key, value, desc) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.appendRow([key, value, desc || '']);
    return;
  }

  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === String(key).trim()) {
      sheet.getRange(i + 2, 2).setValue(value);
      if (desc) sheet.getRange(i + 2, 3).setValue(desc);
      return;
    }
  }

  sheet.appendRow([key, value, desc || '']);
}

/**
 * Cập nhật thời điểm đồng bộ
 */
function updateLastSyncTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Cai_Dat');
  if (!sheet) sheet = ss.insertSheet('Cai_Dat');

  const nowStr = new Date().toISOString();
  upsertSetting(sheet, 'last_sync_time', nowStr, 'Thời điểm đồng bộ gần nhất');
  SpreadsheetApp.getUi().alert('🕒 Đã ghi nhận thời gian đồng bộ: ' + nowStr);
}

/**
 * Hướng dẫn sử dụng
 */
function showUserGuide() {
  const ui = SpreadsheetApp.getUi();
  const msg = 
    '=== HƯỚNG DẪN CÁN BỘ VIETINBANK NINH BÌNH ===\\n\\n' +
    '1. Bảng tính này đồng bộ 2 chiều trực tiếp với Ứng dụng di động CX400 theo nguyên tắc UPSERT theo ID (không xóa sạch ghi lại).\\n' +
    '2. Các Tab dữ liệu gồm có:\\n' +
    '   - Cau_Chuyen: Kho tình huống lừa đảo & bài học cảnh giác.\\n' +
    '   - Khach_Hang_Chia_Se: Câu chuyện thực tế do khách hàng gửi qua ứng dụng (PENDING_REVIEW / UNDER_REVIEW / PUBLISHED).\\n' +
    '   - Canh_Bao: Cảnh báo khẩn cấp xuất hiện trên đầu bản tin.\\n' +
    '   - Danh_Muc: Các nhóm loại lừa đảo.\\n' +
    '   - Quiz: Câu hỏi trắc nghiệm rèn luyện phản xạ.\\n' +
    '   - Cai_Dat: Số Hotline và thông tin tiếp đón khách hàng chi nhánh.\\n' +
    '   - Thong_Ke: Báo cáo lượt tương tác.\\n' +
    '   - Ket_Qua_Quiz: Nhật ký kết quả làm quiz của khách hàng.\\n' +
    '   - Nhat_Ky_Audit: Lịch sử thao tác kiểm soát nội bộ.\\n\\n' +
    '3. Sau khi chỉnh sửa nội dung trên Google Sheet, vào ứng dụng web CX400 bấm "Đồng bộ từ Google Sheet" để cập nhật ngay!';
    
  ui.alert(msg);
}

/**
 * ==============================================================================
 * 8. API WEB APP: ĐỌC DỮ LIỆU TOÀN DIỆN DƯỚI DẠNG JSON (HTTP GET)
 * ==============================================================================
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {
      status: 'success',
      generated_at: new Date().toISOString(),
      bank: 'VietinBank Ninh Bình',
      department: 'Phòng DVKH',
      data: {
        stories: [],
        customer_submissions: [],
        alerts: [],
        categories: [],
        quizzes: [],
        settings: {},
        analytics: {},
        quiz_results: [],
        audit_logs: []
      }
    };

    // 1. Cau_Chuyen
    const storySheet = ss.getSheetByName('Cau_Chuyen');
    if (storySheet && storySheet.getLastRow() > 1) {
      const rows = storySheet.getRange(2, 1, storySheet.getLastRow() - 1, 24).getValues();
      result.data.stories = rows.filter(r => r && r[1]).map(r => ({
        id: r[0],
        title: r[1],
        category_id: r[2],
        risk_level: r[3],
        situation: r[4],
        scam_method: r[5],
        warning_signs: r[6] ? String(r[6]).split('||').map(s => s.trim()).filter(Boolean) : [],
        recommended_action: r[7] ? String(r[7]).split('||').map(s => s.trim()).filter(Boolean) : [],
        lesson: r[8],
        author_id: r[9] || 'cbo_vietinbank',
        author_name: r[10] || 'Cán bộ VietinBank',
        status: r[11] || 'PUBLISHED',
        views_count: Number(r[12]) || 0,
        image_url: r[13] || '',
        rejection_note: r[14] || '',
        source_type: r[15] || 'OFFICIAL',
        source_submission_id: r[16] || '',
        helpful_votes: Number(r[17]) || 0,
        created_at: r[18] || r[19] || new Date().toISOString(),
        updated_at: r[19] || new Date().toISOString(),
        submitted_at: r[20] || '',
        approved_by: r[21] || '',
        approved_at: r[22] || '',
        published_at: r[23] || (r[11] === 'PUBLISHED' ? r[19] || '' : '')
      }));
    }

    // 2. Khach_Hang_Chia_Se
    const customerSheet = ss.getSheetByName('Khach_Hang_Chia_Se');
    if (customerSheet && customerSheet.getLastRow() > 1) {
      const rows = customerSheet.getRange(2, 1, customerSheet.getLastRow() - 1, 23).getValues();
      result.data.customer_submissions = rows.filter(r => r && r[2]).map(r => ({
        id: r[0],
        submitted_at: r[1],
        raw_title: r[2],
        raw_content: r[3],
        scam_method: r[4] || '',
        customer_action: r[5] || '',
        customer_lesson: r[6] || '',
        category_id: r[7] || 'cat_congan',
        is_anonymous: String(r[8]).toUpperCase() === 'TRUE',
        display_name: r[9] || '',
        contact_phone: r[10] || '',
        contact_email: r[11] || '',
        status: r[12] || 'PENDING_REVIEW',
        reviewed_by: r[13] || '',
        reviewed_at: r[14] || '',
        review_note: r[15] || '',
        published_story_id: r[16] || '',
        edited_title: r[17] || '',
        edited_situation: r[18] || '',
        edited_scam_method: r[19] || '',
        edited_lesson: r[20] || '',
        created_at: r[21] || r[1] || new Date().toISOString(),
        updated_at: r[22] || r[14] || r[1] || new Date().toISOString()
      }));
    }

    // 3. Canh_Bao
    const alertSheet = ss.getSheetByName('Canh_Bao');
    if (alertSheet && alertSheet.getLastRow() > 1) {
      const rows = alertSheet.getRange(2, 1, alertSheet.getLastRow() - 1, 7).getValues();
      result.data.alerts = rows.filter(r => r && r[1]).map(r => ({
        id: r[0],
        title: r[1],
        content: r[2],
        risk_level: r[3],
        status: r[4] || 'active',
        image_url: r[5] || '',
        created_at: r[6] || new Date().toISOString()
      }));
    }

    // 4. Danh_Muc
    const catSheet = ss.getSheetByName('Danh_Muc');
    if (catSheet && catSheet.getLastRow() > 1) {
      const rows = catSheet.getRange(2, 1, catSheet.getLastRow() - 1, 5).getValues();
      result.data.categories = rows.filter(r => r && r[1]).map(r => ({
        id: r[0],
        name: r[1],
        icon: r[2] || 'AlertTriangle',
        description: r[3] || '',
        status: r[4] || 'active'
      }));
    }

    // 5. Quiz
    const quizSheet = ss.getSheetByName('Quiz');
    if (quizSheet && quizSheet.getLastRow() > 1) {
      const rows = quizSheet.getRange(2, 1, quizSheet.getLastRow() - 1, 10).getValues();
      result.data.quizzes = rows.filter(r => r && r[1]).map(r => ({
        id: r[0],
        question: r[1],
        options: [r[2], r[3], r[4], r[5]].filter(Boolean),
        correct_answer: Number(r[6]) || 0,
        explanation: r[7] || '',
        story_id: r[8] || '',
        status: r[9] || 'active'
      }));
    }

    // 6. Cai_Dat
    const settingsSheet = ss.getSheetByName('Cai_Dat');
    if (settingsSheet && settingsSheet.getLastRow() > 1) {
      const rows = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 3).getValues();
      rows.forEach(r => {
        if (r && r[0]) {
          result.data.settings[r[0]] = String(r[1] || '');
        }
      });
    }

    // 7. Thong_Ke
    const statsSheet = ss.getSheetByName('Thong_Ke');
    if (statsSheet && statsSheet.getLastRow() > 1) {
      const rows = statsSheet.getRange(2, 1, statsSheet.getLastRow() - 1, 3).getValues();
      rows.forEach(r => {
        if (r && r[0]) {
          if (r[0] === 'total_views') result.data.analytics.total_views = Number(r[1]) || 0;
          if (r[0] === 'total_quizzes_taken') result.data.analytics.total_quizzes_taken = Number(r[1]) || 0;
          if (r[0] === 'total_sos_clicks') result.data.analytics.total_sos_clicks = Number(r[1]) || 0;
        }
      });
    }

    // 8. Ket_Qua_Quiz
    const quizResSheet = ss.getSheetByName('Ket_Qua_Quiz');
    if (quizResSheet && quizResSheet.getLastRow() > 1) {
      const rows = quizResSheet.getRange(2, 1, quizResSheet.getLastRow() - 1, 8).getValues();
      result.data.quiz_results = rows.filter(r => r && r[0]).map(r => ({
        id: r[0],
        quiz_id: r[1] || '',
        story_id: r[2] || '',
        total_questions: Number(r[3]) || 5,
        correct_count: Number(r[4]) || 0,
        score_ratio: (Number(r[5]) || 0) / 100,
        session_id: r[6] || '',
        timestamp: r[7] || new Date().toISOString()
      }));
    }

    // 9. Nhat_Ky_Audit
    const auditSheet = ss.getSheetByName('Nhat_Ky_Audit');
    if (auditSheet && auditSheet.getLastRow() > 1) {
      const rows = auditSheet.getRange(2, 1, auditSheet.getLastRow() - 1, 11).getValues();
      result.data.audit_logs = rows.filter(r => r && r[0]).map(r => ({
        id: r[0],
        timestamp: r[1],
        user_id: r[2],
        user_name: r[3],
        role: r[4],
        action: r[5],
        entity_type: r[6],
        entity_id: r[7],
        description: r[8],
        old_status: r[9] || '',
        new_status: r[10] || ''
      }));
    }

    return ContentService.createTextOutput(JSON.stringify(result, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ==============================================================================
 * 9. API WEB APP: XỬ LÝ ĐẨY DỮ LIỆU LÊN (HTTP POST) THEO CƠ CHẾ UPSERT THEO ID
 * ==============================================================================
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = JSON.parse(e.postData.contents);
    let processed = 0;

    // Helper ensure sheet exists
    function getOrCreateSheet(name) {
      let sheet = ss.getSheetByName(name);
      if (!sheet) sheet = ss.insertSheet(name);
      return sheet;
    }

    if (payload.action === 'SYNC_QUEUE' && Array.isArray(payload.items)) {
      payload.items.forEach(item => {
        const entityType = item.entity_type || item.entity;
        const data = item.payload;
        if (!data) return;

        if (entityType === 'QUIZ_RESULT') {
          const sheet = getOrCreateSheet('Ket_Qua_Quiz');
          const rowValues = [
            data.id,
            data.quiz_id || '',
            data.story_id || '',
            data.total_questions || 5,
            data.correct_count || 0,
            Math.round((data.score_ratio || 0) * 100),
            data.session_id || '',
            data.timestamp || new Date().toISOString()
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'AUDIT') {
          const sheet = getOrCreateSheet('Nhat_Ky_Audit');
          const rowValues = [
            data.id,
            data.timestamp || new Date().toISOString(),
            data.user_id || '',
            data.user_name || '',
            data.role || '',
            data.action || '',
            data.entity_type || '',
            data.entity_id || '',
            data.description || '',
            data.old_status || '',
            data.new_status || ''
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'CUSTOMER_SUBMISSION') {
          const sheet = getOrCreateSheet('Khach_Hang_Chia_Se');
          const rowValues = [
            data.id,
            data.submitted_at || data.created_at || new Date().toISOString(),
            data.raw_title,
            data.raw_content,
            data.scam_method || '',
            data.customer_action || '',
            data.customer_lesson || '',
            data.category_id || '',
            data.is_anonymous ? 'TRUE' : 'FALSE',
            data.display_name || '',
            data.contact_phone || '',
            data.contact_email || '',
            data.status || 'PENDING_REVIEW',
            data.reviewed_by || '',
            data.reviewed_at || '',
            data.review_note || '',
            data.published_story_id || '',
            data.edited_title || '',
            data.edited_situation || '',
            data.edited_scam_method || '',
            data.edited_lesson || '',
            data.created_at || new Date().toISOString(),
            data.updated_at || new Date().toISOString()
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'STORY') {
          const sheet = getOrCreateSheet('Cau_Chuyen');
          const rowValues = [
            data.id,
            data.title,
            data.category_id,
            data.risk_level,
            data.situation,
            data.scam_method,
            (data.warning_signs || []).join(' || '),
            (data.recommended_action || []).join(' || '),
            data.lesson,
            data.author_id || 'cbo_vietinbank',
            data.author_name || 'Cán bộ VietinBank',
            data.status,
            data.views_count || 0,
            data.image_url || '',
            data.rejection_note || '',
            data.source_type || 'OFFICIAL',
            data.source_submission_id || '',
            data.helpful_votes || 0,
            data.created_at || new Date().toISOString(),
            data.updated_at || new Date().toISOString(),
            data.submitted_at || '',
            data.approved_by || '',
            data.approved_at || '',
            data.published_at || (data.status === 'PUBLISHED' ? data.updated_at : '')
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'ALERT') {
          const sheet = getOrCreateSheet('Canh_Bao');
          const rowValues = [
            data.id,
            data.title,
            data.content,
            data.risk_level,
            data.status,
            data.image_url || '',
            data.created_at || new Date().toISOString()
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'CATEGORY') {
          const sheet = getOrCreateSheet('Danh_Muc');
          const rowValues = [
            data.id,
            data.name,
            data.icon,
            data.description,
            data.status
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'QUIZ') {
          const sheet = getOrCreateSheet('Quiz');
          const rowValues = [
            data.id,
            data.question,
            data.options?.[0] || '',
            data.options?.[1] || '',
            data.options?.[2] || '',
            data.options?.[3] || '',
            data.correct_answer || 0,
            data.explanation || '',
            data.story_id || '',
            data.status || 'active'
          ];
          upsertRowInSheet(sheet, data.id, rowValues);
          processed++;
        } else if (entityType === 'SETTINGS') {
          const sheet = getOrCreateSheet('Cai_Dat');
          if (data.hotline_support) upsertSetting(sheet, 'hotline_support', data.hotline_support);
          if (data.hotline_branch) upsertSetting(sheet, 'hotline_branch', data.hotline_branch);
          if (data.emergency_address) upsertSetting(sheet, 'emergency_address', data.emergency_address);
          if (data.branch_name) upsertSetting(sheet, 'branch_name', data.branch_name);
          processed++;
        }
      });

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        processed: processed
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      processed: 0
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
