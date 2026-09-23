import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
  FileText,
  UserCheck,
  EyeOff,
  Phone,
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  Category,
  CustomerStorySubmission,
  CustomerSubmissionStatus,
  RiskLevel,
  User,
} from '../types';
import { store } from '../services/store';

interface CustomerStoriesManagerProps {
  currentUser: User;
  categories: Category[];
  onOpenStoryDetail?: (storyId: string) => void;
}

export function CustomerStoriesManager({
  currentUser,
  categories,
  onOpenStoryDetail,
}: CustomerStoriesManagerProps) {
  const [submissions, setSubmissions] = useState<CustomerStorySubmission[]>(() =>
    store.getCustomerSubmissions()
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSub, setSelectedSub] = useState<CustomerStorySubmission | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'RAW' | 'EDIT'>('EDIT');

  // Editorial working state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState(categories[0]?.id || 'cat_congan');
  const [editRiskLevel, setEditRiskLevel] = useState<RiskLevel>('CAO');
  const [editSituation, setEditSituation] = useState('');
  const [editScamMethod, setEditScamMethod] = useState('');
  const [editWarningSigns, setEditWarningSigns] = useState<string[]>([]);
  const [newWarningSign, setNewWarningSign] = useState('');
  const [editRecommendedAction, setEditRecommendedAction] = useState<string[]>([]);
  const [newRecommendedAction, setNewRecommendedAction] = useState('');
  const [editLesson, setEditLesson] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  // Refresh data from store
  const refreshList = () => {
    setSubmissions(store.getCustomerSubmissions());
  };

  // Open modal and pre-fill editorial inputs
  const handleOpenEditor = (sub: CustomerStorySubmission) => {
    setSelectedSub(sub);
    setActiveModalTab(sub.status === 'PUBLISHED' ? 'RAW' : 'EDIT');

    setEditTitle(sub.edited_title || sub.raw_title);
    setEditCategory(sub.edited_category_id || sub.category_id || categories[0]?.id || 'cat_congan');
    setEditRiskLevel(sub.edited_risk_level || sub.risk_level || 'CAO');
    setEditSituation(sub.edited_situation || sub.raw_content);
    setEditScamMethod(
      sub.edited_scam_method ||
        sub.scam_method ||
        'Đối tượng sử dụng công nghệ cao, thao túng tâm lý đe dọa hoặc mồi chài nạn nhân chuyển tiền.'
    );

    const defaultSigns = sub.edited_warning_signs?.length
      ? sub.edited_warning_signs
      : [
          'Cuộc gọi tự xưng Công an/Ngân hàng yêu cầu chuyển tiền hoặc giữ bí mật',
          'Đường link lạ yêu cầu tải ứng dụng không rõ nguồn gốc (.apk)',
          'Hứa hẹn lợi nhuận bất thường hoặc đe dọa lệnh bắt tạm giam',
        ];
    setEditWarningSigns(defaultSigns);

    const defaultActions = sub.edited_recommended_action?.length
      ? sub.edited_recommended_action
      : [
          'Tuyệt đối không chuyển tiền vào tài khoản người lạ chỉ định',
          'Không cung cấp mật khẩu, mã xác thực OTP cho bất kỳ ai',
          'Liên hệ ngay hotline VietinBank 1900 558 868 hoặc chi nhánh gần nhất để được hỗ trợ',
        ];
    setEditRecommendedAction(defaultActions);

    setEditLesson(
      sub.edited_lesson ||
        sub.customer_lesson ||
        'VietinBank và các cơ quan nhà nước không bao giờ gọi điện yêu cầu chuyển tiền hay cung cấp OTP qua điện thoại.'
    );
    setReviewNote(sub.review_note || '');
  };

  // Filter list
  const filteredSubmissions = submissions.filter(s => {
    if (statusFilter === 'ALL') return true;
    return s.status === statusFilter;
  });

  const getStatusBadge = (status: CustomerSubmissionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return {
          label: 'Chờ biên tập',
          class: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Đang xử lý',
          class: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-500',
        };
      case 'NEED_REVISION':
        return {
          label: 'Cần sửa lại',
          class: 'bg-orange-100 text-orange-900 border-orange-300',
          dot: 'bg-orange-500',
        };
      case 'PUBLISHED':
        return {
          label: 'Đã xuất bản',
          class: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'REJECTED':
        return {
          label: 'Từ chối',
          class: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
      default:
        return {
          label: status,
          class: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  // Action: Save Draft (UNDER_REVIEW)
  const handleSaveDraft = () => {
    if (!selectedSub) return;
    store.updateCustomerSubmission(selectedSub.id, {
      status: 'UNDER_REVIEW',
      reviewed_by: currentUser.full_name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote.trim() || undefined,
      edited_title: editTitle.trim(),
      edited_category_id: editCategory,
      edited_risk_level: editRiskLevel,
      edited_situation: editSituation.trim(),
      edited_scam_method: editScamMethod.trim(),
      edited_warning_signs: editWarningSigns,
      edited_recommended_action: editRecommendedAction,
      edited_lesson: editLesson.trim(),
    });
    alert('Đã lưu bản nháp biên tập thành công!');
    refreshList();
    setSelectedSub(null);
  };

  // Action: Request revision (NEED_REVISION)
  const handleRequestRevision = () => {
    if (!selectedSub) return;
    const note = prompt('Nhập lý do cần cán bộ hoặc khách hàng điều chỉnh lại nội dung:', reviewNote);
    if (note === null) return;
    store.reviewCustomerSubmission(selectedSub.id, currentUser.full_name, 'NEED_REVISION', note);
    alert('Đã chuyển trạng thái câu chuyện sang [Cần sửa lại]!');
    refreshList();
    setSelectedSub(null);
  };

  // Action: Reject (REJECTED)
  const handleReject = () => {
    if (!selectedSub) return;
    if (confirm('Bạn có chắc chắn muốn từ chối câu chuyện này không?')) {
      store.reviewCustomerSubmission(
        selectedSub.id,
        currentUser.full_name,
        'REJECTED',
        'Nội dung không phù hợp hoặc trùng lặp với các tình huống đã có.'
      );
      alert('Đã từ chối câu chuyện.');
      refreshList();
      setSelectedSub(null);
    }
  };

  // Action: Publish! (PUBLISHED)
  const handlePublish = () => {
    if (!selectedSub) return;
    if (!editTitle.trim() || !editSituation.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung tình huống xảy ra.');
      return;
    }

    try {
      const publishedStory = store.publishCustomerSubmission(
        selectedSub.id,
        currentUser.full_name,
        {
          title: editTitle.trim(),
          category_id: editCategory,
          risk_level: editRiskLevel,
          situation: editSituation.trim(),
          scam_method: editScamMethod.trim(),
          warning_signs: editWarningSigns,
          recommended_action: editRecommendedAction,
          lesson: editLesson.trim(),
          image_url: selectedSub.image_urls?.[0],
        }
      );

      alert(
        `🎉 ĐÃ PHÊ DUYỆT & XUẤT BẢN THÀNH CÔNG!\n\nCâu chuyện đã xuất hiện trong Bản tin cảnh báo và kho chiêu trò với ID: ${publishedStory.id}`
      );
      refreshList();
      setSelectedSub(null);
    } catch (err: any) {
      alert(`Lỗi khi xuất bản: ${err?.message || 'Vui lòng thử lại'}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              QUẢN LÝ CÂU CHUYỆN KHÁCH HÀNG CHIA SẺ
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tiếp nhận, thẩm định, biên tập và phê duyệt xuất bản các câu chuyện thực tế từ khách hàng VietinBank.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            Tổng cộng: <strong>{submissions.length}</strong> bài
          </span>
          <button
            onClick={refreshList}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            title="Làm mới danh sách"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'PENDING_REVIEW', label: 'Chờ biên tập' },
          { id: 'UNDER_REVIEW', label: 'Đang xử lý' },
          { id: 'NEED_REVISION', label: 'Cần sửa lại' },
          { id: 'PUBLISHED', label: 'Đã xuất bản' },
          { id: 'REJECTED', label: 'Đã từ chối' },
        ].map(tab => {
          const count =
            tab.id === 'ALL'
              ? submissions.length
              : submissions.filter(s => s.status === tab.id).length;
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#004B87] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Chưa có câu chuyện nào ở trạng thái này</p>
          <p className="text-xs text-slate-400">
            Các câu chuyện do khách hàng gửi qua mục &quot;Chia sẻ câu chuyện của mình&quot; sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map(sub => {
            const statusBadge = getStatusBadge(sub.status);
            const catName = categories.find(c => c.id === sub.category_id)?.name || 'Chiêu trò lừa đảo';
            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 hover:border-[#004B87] hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-sm border flex items-center gap-1.5 ${statusBadge.class}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </span>

                    <span className="text-[11px] font-bold text-[#004B87] bg-sky-50 px-2 py-0.5 rounded-sm border border-sky-200">
                      {catName}
                    </span>

                    {sub.is_anonymous ? (
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Khách hàng ẩn danh</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tên hiển thị: {sub.display_name || 'Khách hàng'}</span>
                      </span>
                    )}

                    {sub.contact_phone && (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{sub.contact_phone}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(sub.submitted_at || sub.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                    {sub.raw_title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium mt-1">
                    {sub.raw_content}
                  </p>
                </div>

                {sub.review_note && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
                    <strong>Ghi chú xử lý:</strong> {sub.review_note}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-500">
                    Mã tiếp nhận: <strong className="font-mono text-slate-700">{sub.id}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'PUBLISHED' && sub.published_story_id && (
                      <button
                        onClick={() => onOpenStoryDetail && onOpenStoryDetail(sub.published_story_id!)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem bản tin đã xuất bản</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditor(sub)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-[#004B87] hover:bg-[#003B70] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{sub.status === 'PUBLISHED' ? 'Xem chi tiết' : 'Biên tập & Phê duyệt'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* EDITORIAL & APPROVAL MODAL (Section XII to XIX)                    */}
      {/* ================================================================= */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-[#004B87]">
                    BIÊN TẬP VÀ PHÊ DUYỆT CÂU CHUYỆN KHÁCH HÀNG
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                      getStatusBadge(selectedSub.status).class
                    }`}
                  >
                    {getStatusBadge(selectedSub.status).label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Mã tiếp nhận: <span className="font-mono">{selectedSub.id}</span> • Ngày gửi:{' '}
                  {new Date(selectedSub.submitted_at || selectedSub.created_at).toLocaleString('vi-VN')}
                </div>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-slate-200 bg-white px-5 pt-2 shrink-0">
              <button
                onClick={() => setActiveModalTab('EDIT')}
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeModalTab === 'EDIT'
                    ? 'border-[#004B87] text-[#004B87]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Nội dung sau biên tập (Bản tin VietinBank)</span>
              </button>

              <button
                onClick={() => setActiveModalTab('RAW')}
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeModalTab === 'RAW'
                    ? 'border-[#004B87] text-[#004B87]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Nội dung gốc khách hàng gửi</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* TAB 1: EDITORIAL WORKBENCH */}
              {activeModalTab === 'EDIT' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 font-medium flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#004B87] shrink-0 mt-0.5" />
                    <span>
                      <strong>Quy chuẩn biên tập:</strong> Cán bộ/Lãnh đạo chuẩn hóa văn phong truyền thông, loại bỏ thông tin nhạy cảm, làm nổi bật thủ đoạn tinh vi và bài học xử lý chuẩn cho cộng đồng.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Select */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Nhóm thủ đoạn (Danh mục) <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-semibold focus:outline-hidden focus:border-[#004B87]"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Risk Level */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Mức độ nguy hiểm <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={editRiskLevel}
                        onChange={e => setEditRiskLevel(e.target.value as RiskLevel)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-semibold focus:outline-hidden focus:border-[#004B87]"
                      >
                        <option value="RAT_CAO">🔴 RẤT CAO - Khẩn cấp</option>
                        <option value="CAO">🟠 CAO - Chiêu trò nguy hiểm</option>
                        <option value="TRUNG_BINH">🟡 TRUNG BÌNH</option>
                        <option value="THAP">🟢 THẤP</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Tiêu đề bài viết bản tin <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Ví dụ: Giả danh Công an gọi điện dọa bắt tạm giam..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:outline-hidden focus:border-[#004B87]"
                    />
                  </div>

                  {/* Situation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      1. Tình huống xảy ra (Chuyện gì đã xảy ra) <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={editSituation}
                      onChange={e => setEditSituation(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:border-[#004B87]"
                    />
                  </div>

                  {/* Scam Method */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      2. Thủ đoạn lừa đảo của đối tượng (Phân tích chiêu trò)
                    </label>
                    <textarea
                      rows={2}
                      value={editScamMethod}
                      onChange={e => setEditScamMethod(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:border-[#004B87]"
                    />
                  </div>

                  {/* Warning Signs List */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-amber-800 uppercase flex items-center justify-between">
                      <span>3. Dấu hiệu nhận biết</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({editWarningSigns.length} dấu hiệu)
                      </span>
                    </label>

                    <div className="space-y-1.5">
                      {editWarningSigns.map((sign, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sign}
                            onChange={e => {
                              const copy = [...editWarningSigns];
                              copy[idx] = e.target.value;
                              setEditWarningSigns(copy);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditWarningSigns(editWarningSigns.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newWarningSign}
                          onChange={e => setNewWarningSign(e.target.value)}
                          placeholder="Thêm dấu hiệu nhận biết mới..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newWarningSign.trim()) {
                                setEditWarningSigns([...editWarningSigns, newWarningSign.trim()]);
                                setNewWarningSign('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newWarningSign.trim()) {
                              setEditWarningSigns([...editWarningSigns, newWarningSign.trim()]);
                              setNewWarningSign('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Action List */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
                      <span>4. Bạn nên làm gì (Hành động khuyến nghị)</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({editRecommendedAction.length} hành động)
                      </span>
                    </label>

                    <div className="space-y-1.5">
                      {editRecommendedAction.map((act, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={act}
                            onChange={e => {
                              const copy = [...editRecommendedAction];
                              copy[idx] = e.target.value;
                              setEditRecommendedAction(copy);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditRecommendedAction(
                                editRecommendedAction.filter((_, i) => i !== idx)
                              )
                            }
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newRecommendedAction}
                          onChange={e => setNewRecommendedAction(e.target.value)}
                          placeholder="Thêm khuyến nghị hành động..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newRecommendedAction.trim()) {
                                setEditRecommendedAction([
                                  ...editRecommendedAction,
                                  newRecommendedAction.trim(),
                                ]);
                                setNewRecommendedAction('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newRecommendedAction.trim()) {
                              setEditRecommendedAction([
                                ...editRecommendedAction,
                                newRecommendedAction.trim(),
                              ]);
                              setNewRecommendedAction('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lesson */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#003B70] uppercase">
                      5. Bài học cốt lõi từ VietinBank
                    </label>
                    <textarea
                      rows={2}
                      value={editLesson}
                      onChange={e => setEditLesson(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:border-[#004B87]"
                    />
                  </div>

                  {/* Review Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Ghi chú nội bộ của Lãnh đạo
                    </label>
                    <input
                      type="text"
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      placeholder="Ý kiến chỉ đạo hoặc lưu ý nội bộ..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: RAW SUBMISSION (READ-ONLY) */}
              {activeModalTab === 'RAW' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase">Danh tính người gửi:</div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                      <span>{selectedSub.is_anonymous ? 'Ẩn danh' : selectedSub.display_name}</span>
                      {selectedSub.contact_phone && (
                        <span className="flex items-center gap-1 text-slate-600 font-mono">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedSub.contact_phone}</span>
                        </span>
                      )}
                      {selectedSub.contact_email && (
                        <span className="flex items-center gap-1 text-slate-600 font-mono">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{selectedSub.contact_email}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Tiêu đề gốc:</div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-900">
                      {selectedSub.raw_title}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase">Nội dung câu chuyện:</div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {selectedSub.raw_content}
                    </div>
                  </div>

                  {selectedSub.scam_method && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase">Kẻ lừa đảo đã làm gì:</div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800">
                        {selectedSub.scam_method}
                      </div>
                    </div>
                  )}

                  {selectedSub.customer_action && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase">Khách hàng đã xử lý:</div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800">
                        {selectedSub.customer_action}
                      </div>
                    </div>
                  )}

                  {selectedSub.customer_lesson && (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase">Lời nhắn nhủ:</div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800">
                        {selectedSub.customer_lesson}
                      </div>
                    </div>
                  )}

                  {selectedSub.image_urls && selectedSub.image_urls.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase">Hình ảnh bằng chứng:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSub.image_urls.map((img, i) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-28 h-28 rounded-xl overflow-hidden border border-slate-300 hover:opacity-90 transition-opacity"
                          >
                            <img src={img} alt="Bằng chứng" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Action Buttons Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {selectedSub.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Từ chối
                  </button>
                )}

                {selectedSub.status !== 'NEED_REVISION' && (
                  <button
                    type="button"
                    onClick={handleRequestRevision}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-orange-800 hover:bg-orange-50 transition-colors"
                  >
                    Yêu cầu sửa lại
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu nháp biên tập</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-5 py-2.5 rounded-xl bg-[#004B87] hover:bg-[#003B70] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-[#004B87]/20 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✅ PHÊ DUYỆT & XUẤT BẢN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
