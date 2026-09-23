export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * DỰ ÁN: CX400 – TRUYỀN THÔNG CẢNH GIÁC LỪA ĐẢO
 * ĐƠN VỊ: CHI NHÁNH VIETINBANK NINH BÌNH - PHÒNG DỊCH VỤ KHÁCH HÀNG (DVKH)
 * GOOGLE APPS SCRIPT CHO GOOGLE SPREADSHEET
 * ==============================================================================
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở file Google Sheet của bạn.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết mã mặc định trong file Code.gs và dán toàn bộ đoạn mã này vào.
 * 4. Nhấn nút "Lưu dự án" (biểu tượng đĩa mềm 💾 hoặc nhấn Ctrl + S).
 * 5. Tải lại (F5) trang Google Sheet, bạn sẽ thấy menu mới: "🛡️ VIETINBANK CX400".
 * ==============================================================================
 */

// Màu sắc nhận diện thương hiệu VietinBank
const BRAND_COLORS = {
  PRIMARY: '#004C97',       // Xanh VietinBank
  SECONDARY: '#ED1C24',     // Đỏ cảnh báo / điểm nhấn
  HEADER_BG: '#003366',     // Nền tiêu đề cột
  HEADER_TEXT: '#FFFFFF',   // Chữ tiêu đề
  ROW_EVEN: '#F4F8FC',      // Dòng chẵn xen kẽ
  ROW_ODD: '#FFFFFF',       // Dòng lẻ
  BORDER: '#D0DCE5',        // Đường viền ô
};

/**
 * Tự động tạo menu khi mở bảng tính
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛡️ VIETINBANK CX400')
    .addItem('🎨 Định dạng bảng chuẩn VietinBank', 'formatAllSheets')
    .addItem('🔍 Kiểm tra tính hợp lệ dữ liệu', 'validateAllData')
    .addSeparator()
    .addItem('➕ Thêm tình huống lừa đảo mới', 'addNewStoryTemplate')
    .addItem('➕ Thêm cảnh báo khẩn cấp mới', 'addNewAlertTemplate')
    .addItem('➕ Thêm câu hỏi trắc nghiệm mới', 'addNewQuizTemplate')
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
  const sheetNames = ['Cau_Chuyen', 'Canh_Bao', 'Danh_Muc', 'Quiz', 'Cai_Dat', 'Thong_Ke'];
  
  sheetNames.forEach(name => {
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

  SpreadsheetApp.getUi().alert('✅ Đã định dạng toàn bộ 6 bảng tính thành công theo quy chuẩn VietinBank!');
}

/**
 * 2. KIỂM TRA HỢP LỆ DỮ LIỆU TRÁNH THIẾU THÔNG TIN
 */
function validateAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errors = [];

  // Kiểm tra Sheet Cau_Chuyen
  const storySheet = ss.getSheetByName('Cau_Chuyen');
  if (storySheet && storySheet.getLastRow() > 1) {
    const stories = storySheet.getRange(2, 1, storySheet.getLastRow() - 1, 15).getValues();
    stories.forEach((row, idx) => {
      const line = idx + 2;
      if (!row[0]) errors.push('Cau_Chuyen - Dòng ' + line + ': Thiếu ID');
      if (!row[1]) errors.push('Cau_Chuyen - Dòng ' + line + ': Thiếu Tiêu đề câu chuyện');
      if (!row[4]) errors.push('Cau_Chuyen - Dòng ' + line + ': Thiếu nội dung Tình huống xảy ra');
    });
  }

  // Kiểm tra Sheet Quiz
  const quizSheet = ss.getSheetByName('Quiz');
  if (quizSheet && quizSheet.getLastRow() > 1) {
    const quizzes = quizSheet.getRange(2, 1, quizSheet.getLastRow() - 1, 10).getValues();
    quizzes.forEach((row, idx) => {
      const line = idx + 2;
      if (!row[1]) errors.push('Quiz - Dòng ' + line + ': Thiếu Câu hỏi');
      if (row[6] === '' || isNaN(Number(row[6])) || Number(row[6]) < 0 || Number(row[6]) > 3) {
        errors.push('Quiz - Dòng ' + line + ': Chỉ số đáp án đúng phải là số 0, 1, 2 hoặc 3 (0=Đáp án 1, 1=Đáp án 2,...)');
      }
    });
  }

  const ui = SpreadsheetApp.getUi();
  if (errors.length === 0) {
    ui.alert('🎉 Xuất sắc! Tất cả dữ liệu hợp lệ và sẵn sàng đồng bộ vào ứng dụng CX400.');
  } else {
    ui.alert('⚠️ Phát hiện ' + errors.length + ' cảnh báo:\\n\\n- ' + errors.slice(0, 10).join('\\n- ') + (errors.length > 10 ? '\\n... và các lỗi khác' : ''));
  }
}

/**
 * 3. THÊM TÌNH HUỐNG LỪA ĐẢO MẪU MỚI
 */
function addNewStoryTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Cau_Chuyen');
  if (!sheet) {
    formatAllSheets();
    sheet = ss.getSheetByName('Cau_Chuyen');
  }

  const newId = 'story_' + new Date().getTime();
  const now = new Date().toISOString();
  
  sheet.appendRow([
    newId,
    'Tên chiêu thức lừa đảo mới (VD: Giả danh CSGT phạt nguội)',
    'cat_gia_danh',
    'CAO',
    'Mô tả hoàn cảnh khách hàng gặp phải...',
    'Thủ đoạn: Đối tượng dùng công nghệ gì, nói những gì...',
    'Dấu hiệu 1 || Dấu hiệu 2 || Dấu hiệu 3 (ngăn cách bởi dấu ||)',
    'Hành động 1 || Hành động 2 (ngăn cách bởi dấu ||)',
    'Bài học rút ra cho khách hàng...',
    'Cán bộ DVKH VietinBank',
    'PUBLISHED',
    0,
    '',
    '',
    now
  ]);

  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 dòng mẫu mới tại sheet [Cau_Chuyen]. Cán bộ có thể chỉnh sửa nội dung trực tiếp.');
}

/**
 * 4. THÊM CẢNH BÁO KHẨN CẤP MẪU
 */
function addNewAlertTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Canh_Bao');
  if (!sheet) return;

  const newId = 'alert_' + new Date().getTime();
  const now = new Date().toISOString();

  sheet.appendRow([
    newId,
    'CẢNH BÁO KHẨN: Thủ đoạn giả mạo cán bộ VietinBank gọi điện hỗ trợ sinh trắc học',
    'Đối tượng gọi video call yêu cầu quét khuôn mặt và đọc mã OTP...',
    'KHAN_CAP',
    'active',
    '',
    now
  ]);

  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 dòng cảnh báo mới tại sheet [Canh_Bao].');
}

/**
 * 5. THÊM CÂU HỎI TRẮC NGHIỆM MẪU
 */
function addNewQuizTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Quiz');
  if (!sheet) return;

  const newId = 'quiz_' + new Date().getTime();

  sheet.appendRow([
    newId,
    'Nếu có người gọi điện tự xưng Công an yêu cầu cài App để điều tra án, bạn cần làm gì?',
    'Làm theo ngay vì sợ bị bắt',
    'Tắt máy ngay và ra Công an phường/xã gần nhất xác minh',
    'Chuyển tiền vào tài khoản an toàn theo hướng dẫn',
    'Cung cấp mật khẩu iPay để họ chứng minh vô tội',
    1, // Chỉ số 1 là đáp án thứ 2 (bắt đầu từ 0)
    'Cơ quan Công an không bao giờ làm việc qua điện thoại hay yêu cầu chuyển tiền/cài phần mềm lạ.',
    '',
    'active'
  ]);

  SpreadsheetApp.getUi().alert('✅ Đã thêm 1 câu hỏi mới tại sheet [Quiz].');
}

/**
 * 6. CẬP NHẬT THỜI GIAN ĐỒNG BỘ GẦN NHẤT
 */
function updateLastSyncTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Thong_Ke');
  if (!sheet) return;

  const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
  const values = sheet.getDataRange().getValues();
  let updated = false;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === 'last_sync') {
      sheet.getRange(i + 1, 2).setValue(nowStr);
      updated = true;
      break;
    }
  }

  if (!updated) {
    sheet.appendRow(['last_sync', nowStr, 'Thời điểm đồng bộ gần nhất']);
  }

  SpreadsheetApp.getUi().alert('🕒 Đã ghi nhận thời gian đồng bộ: ' + nowStr);
}

/**
 * 7. HỘP THOẠI HƯỚNG DẪN SỬ DỤNG
 */
function showUserGuide() {
  const ui = SpreadsheetApp.getUi();
  const msg = 
    '=== HƯỚNG DẪN CÁN BỘ VIETINBANK NINH BÌNH ===\\n\\n' +
    '1. Bảng tính này đồng bộ 2 chiều trực tiếp với Ứng dụng di động CX400.\\n' +
    '2. Các Tab dữ liệu gồm có:\\n' +
    '   - Cau_Chuyen: Kho tình huống lừa đảo & bài học cảnh giác.\\n' +
    '   - Canh_Bao: Cảnh báo khẩn cấp xuất hiện trên đầu trang chủ.\\n' +
    '   - Danh_Muc: Các nhóm loại lừa đảo.\\n' +
    '   - Quiz: Câu hỏi trắc nghiệm rèn luyện phản xạ (Chỉ số đáp án đúng: 0=A, 1=B, 2=C, 3=D).\\n' +
    '   - Cai_Dat: Số Hotline và thông tin tiếp đón khách hàng chi nhánh.\\n' +
    '   - Thong_Ke: Báo cáo lượt tương tác.\\n\\n' +
    '3. Sau khi chỉnh sửa nội dung trên Google Sheet, vào ứng dụng web CX400 bấm "Kéo dữ liệu từ Sheet về máy" để áp dụng ngay lập tức!';
    
  ui.alert(msg);
}

/**
 * 8. API WEB APP (Tùy chọn): Cho phép đọc toàn bộ dữ liệu dưới dạng JSON qua HTTP GET
 * Để sử dụng: Chọn "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment) 
 * -> Loại: "Ứng dụng web" (Web App) -> Ai có quyền truy cập: "Bất kỳ ai" (Anyone).
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {
      status: 'success',
      generated_at: new Date().toISOString(),
      bank: 'VietinBank Ninh Bình',
      department: 'Phòng DVKH',
      data: {}
    };

    // Đọc Cau_Chuyen
    const storySheet = ss.getSheetByName('Cau_Chuyen');
    if (storySheet && storySheet.getLastRow() > 1) {
      const rows = storySheet.getRange(2, 1, storySheet.getLastRow() - 1, 15).getValues();
      result.data.stories = rows.filter(function(r) { return r[1]; }).map(function(r) {
        return {
          id: r[0],
          title: r[1],
          category_id: r[2],
          risk_level: r[3],
          situation: r[4],
          scam_method: r[5],
          warning_signs: r[6] ? String(r[6]).split('||').map(function(s) { return s.trim(); }) : [],
          recommended_action: r[7] ? String(r[7]).split('||').map(function(s) { return s.trim(); }) : [],
          lesson: r[8],
          author_name: r[9],
          status: r[10],
          views_count: Number(r[11]) || 0,
          image_url: r[12] || '',
          updated_at: r[14]
        };
      });
    }

    // Đọc Canh_Bao
    const alertSheet = ss.getSheetByName('Canh_Bao');
    if (alertSheet && alertSheet.getLastRow() > 1) {
      const rows = alertSheet.getRange(2, 1, alertSheet.getLastRow() - 1, 7).getValues();
      result.data.alerts = rows.filter(function(r) { return r[1]; }).map(function(r) {
        return {
          id: r[0],
          title: r[1],
          content: r[2],
          risk_level: r[3],
          status: r[4],
          created_at: r[6]
        };
      });
    }

    // Đọc Quiz
    const quizSheet = ss.getSheetByName('Quiz');
    if (quizSheet && quizSheet.getLastRow() > 1) {
      const rows = quizSheet.getRange(2, 1, quizSheet.getLastRow() - 1, 10).getValues();
      result.data.quizzes = rows.filter(function(r) { return r[1]; }).map(function(r) {
        return {
          id: r[0],
          question: r[1],
          options: [r[2], r[3], r[4], r[5]].filter(Boolean),
          correct_answer: Number(r[6]) || 0,
          explanation: r[7],
          status: r[9]
        };
      });
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
`;
