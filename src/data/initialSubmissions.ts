import { CustomerStorySubmission } from '../types';

export const INITIAL_CUSTOMER_SUBMISSIONS: CustomerStorySubmission[] = [
  {
    id: 'sub_001',
    category_id: 'cat_congan',
    risk_level: 'RAT_CAO',
    raw_title: 'Tôi suýt bị lừa 200 triệu vì cuộc gọi tự xưng Công an điều tra án ma túy',
    raw_content:
      'Sáng thứ 3 vừa rồi, tôi nhận được cuộc gọi từ số lạ 024... xưng là cán bộ Công an TP Hà Nội, thông báo tôi có liên quan đến đường dây rửa tiền xuyên quốc gia. Họ đọc đúng họ tên, số CCCD cũ của tôi nên tôi rất hoảng sợ. Họ bắt tôi vào phòng đóng kín cửa, không được nói với người nhà, dọa nếu tiết lộ sẽ bị bắt tạm giam ngay trong ngày. Họ yêu cầu tôi phải chuyển toàn bộ tiền tiết kiệm sang một tài khoản "tạm giữ của Viện Kiểm sát" để thanh tra, hứa sau 2 tiếng kiểm tra trong sạch sẽ hoàn trả lại.',
    scam_method:
      'Gọi điện thoại mạo danh cơ quan công an, dùng lời lẽ đe dọa lệnh bắt tạm giam, thao túng tâm lý bắt giữ bí mật và chuyển tiền vào tài khoản chỉ định.',
    customer_action:
      'Lúc tôi chuẩn bị ra chi nhánh VietinBank rút sổ tiết kiệm để chuyển, thì nhớ tới lời cán bộ ngân hàng dặn trước đây: Công an không làm việc qua điện thoại. Tôi đã gọi ngay cho người thân và đến thẳng Công an phường để hỏi.',
    customer_lesson:
      'Các cô chú anh chị nhớ: Cơ quan nhà nước không bao giờ gọi điện dọa bắt hay bắt chuyển tiền. Dù họ đọc đúng tên tuổi cũng tuyệt đối không được tin!',
    display_name: 'Cô Mai',
    is_anonymous: false,
    contact_phone: '0912***456',
    status: 'PENDING_REVIEW',
    submitted_at: '2026-09-22T09:15:00Z',
    created_at: '2026-09-22T09:15:00Z',
    updated_at: '2026-09-22T09:15:00Z',
  },
  {
    id: 'sub_002',
    category_id: 'cat_appgia',
    risk_level: 'CAO',
    raw_title: 'Mất quyền kiểm soát điện thoại vì tải app Dịch vụ công qua đường link Zalo',
    raw_content:
      'Có người xưng là cán bộ thuế phường nhắn Zalo hướng dẫn tôi cài đặt cập nhật thuế và định danh VNeID mức 2 để không bị phạt. Họ gửi cho tôi một link web có giao diện y hệt Cổng dịch vụ công Quốc gia, hướng dẫn tôi tải file cài đặt có đuôi .apk về điện thoại Samsung. Khi cài xong máy báo cấp quyền Trợ năng (Accessibility) thì tôi đồng ý. Ngay sau đó màn hình điện thoại bị đen thui khoảng 10 phút.',
    scam_method:
      'Gửi link dẫn tải mã độc APK giả mạo Dịch vụ công, dụ cấp quyền Trợ năng để chiếm quyền điều khiển thiết bị từ xa và đọc trộm mã OTP SMS.',
    customer_action:
      'Tôi thấy bất thường liền lấy điện thoại của vợ gọi ngay tổng đài VietinBank 1900 558 868 để yêu cầu khóa tạm thời tài khoản và thẻ, sau đó tắt nguồn điện thoại mang ra trung tâm bảo hành chạy lại phần mềm.',
    customer_lesson:
      'May mắn tôi khóa tài khoản kịp thời nên chưa mất tiền. Tuyệt đối không bao giờ cài file APK lạ gửi qua tin nhắn Zalo!',
    display_name: '',
    is_anonymous: true,
    status: 'PENDING_REVIEW',
    submitted_at: '2026-09-23T07:30:00Z',
    created_at: '2026-09-23T07:30:00Z',
    updated_at: '2026-09-23T07:30:00Z',
  },
  {
    id: 'sub_003',
    category_id: 'cat_ctv',
    risk_level: 'TRUNG_BINH',
    raw_title: 'Bẫy làm cộng tác viên online xem video trên mạng xã hội',
    raw_content:
      'Tôi nhận được lời mời làm việc bán thời gian tại nhà, nhiệm vụ chỉ là thả tim xem video Youtube, mỗi lượt nhận 30.000đ. Lúc đầu họ chuyển khoản trả thật 60.000đ. Sau đó họ chuyển sang nhóm Telegram yêu cầu nạp tiền "chốt đơn hàng hoàn vốn kèm hoa hồng 30%". Tôi nạp 500k thì nhận lại được 650k. Đến khi tôi nạp 5 triệu thì họ báo sai cú pháp và bắt nạp thêm 20 triệu mới cho rút.',
    scam_method:
      'Thao túng tâm lý "việc nhẹ lương cao", thả mồi số tiền nhỏ để tạo lòng tin, sau đó dẫn dắt nạn nhân nạp số tiền lớn rồi chặn liên lạc.',
    customer_action:
      'Khi họ đòi nạp thêm 20 triệu nữa, tôi nhận ra mình bị lừa nên kiên quyết dừng lại không nạp nữa và rời khỏi nhóm.',
    customer_lesson:
      'Không có công việc nào kiếm tiền dễ dàng như vậy. Đừng vì một chút hoa hồng ban đầu mà mất cả tiền triệu tích góp.',
    display_name: 'Một khách hàng VietinBank',
    is_anonymous: true,
    status: 'UNDER_REVIEW',
    submitted_at: '2026-09-20T14:20:00Z',
    reviewed_by: 'Trần Thị Minh Nguyệt',
    reviewed_at: '2026-09-21T08:30:00Z',
    review_note: 'Câu chuyện rất thực tế, cần biên tập lại rõ các bước thao túng của đối tượng trước khi xuất bản.',
    created_at: '2026-09-20T14:20:00Z',
    updated_at: '2026-09-21T08:30:00Z',
  },
];
