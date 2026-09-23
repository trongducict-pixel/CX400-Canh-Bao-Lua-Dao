import { useState } from 'react';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  FolderOpen,
  BrainCircuit,
  Bell,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Key,
  Shield,
  Send,
  Eye,
  ArrowLeft,
  X,
  RefreshCw,
  PhoneCall,
  Save,
  MessageSquare,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  EyeOff,
} from 'lucide-react';
import {
  AlertItem,
  Category,
  QuizQuestion,
  RiskLevel,
  Role,
  Story,
  SystemSettings,
  User,
} from '../types';
import { store } from '../services/store';

interface AdminPortalProps {
  currentUser: User | null;
  stories: Story[];
  categories: Category[];
  alerts: AlertItem[];
  quizzes: QuizQuestion[];
  users: User[];
  settings: SystemSettings;
  analytics: any;
  onClose: () => void;
  onPreviewStory: (story: Story) => void;
  onOpenSheetsModal: () => void;
}

export function AdminPortal({
  currentUser,
  stories,
  categories,
  alerts,
  quizzes,
  users,
  settings,
  analytics,
  onClose,
  onPreviewStory,
  onOpenSheetsModal,
}: AdminPortalProps) {
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active admin tab:
  // For ADMIN: 'overview' | 'stories' | 'pending' | 'users' | 'categories' | 'alerts' | 'quizzes' | 'settings'
  // For LEADER: 'pending' | 'stories'
  // For STAFF: 'my_stories' | 'create_story'
  const defaultTab = !currentUser
    ? 'login'
    : currentUser.role === 'ADMIN'
    ? 'overview'
    : currentUser.role === 'LEADER'
    ? 'pending'
    : 'my_stories';

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Staff: Create/Edit Story Form State
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyCategory, setStoryCategory] = useState(categories[0]?.id || '');
  const [storyRiskLevel, setStoryRiskLevel] = useState<RiskLevel>('CAO');
  const [storySituation, setStorySituation] = useState('');
  const [storyScamMethod, setStoryScamMethod] = useState('');
  const [storyWarningSigns, setStoryWarningSigns] = useState<string[]>(['']);
  const [storyRecommendedAction, setStoryRecommendedAction] = useState<string[]>(['']);
  const [storyLesson, setStoryLesson] = useState('');
  const [storyImageUrl, setStoryImageUrl] = useState('');

  // Leader: Revision Modal State
  const [revisionStoryId, setRevisionStoryId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  // Admin: New/Edit User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormRole, setUserFormRole] = useState<Role>('STAFF');
  const [userFormDept, setUserFormDept] = useState('Phòng Dịch vụ Khách hàng (DVKH)');

  // Admin: New/Edit Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catFormName, setCatFormName] = useState('');
  const [catFormDesc, setCatFormDesc] = useState('');

  // Admin: New Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertFormTitle, setAlertFormTitle] = useState('');
  const [alertFormContent, setAlertFormContent] = useState('');
  const [alertFormRisk, setAlertFormRisk] = useState<'KHAN_CAP' | 'MOI' | 'KHUYEN_NGHI'>('MOI');

  // Settings form state
  const [tempSettings, setTempSettings] = useState<SystemSettings>({ ...settings });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Authentication Handlers
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    try {
      const user = store.login(loginUsername, loginPassword);
      if (!user) {
        setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        if (user.role === 'ADMIN') setActiveTab('overview');
        else if (user.role === 'LEADER') setActiveTab('pending');
        else setActiveTab('my_stories');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi đăng nhập');
    }
  };

  const handleQuickLogin = (uname: string) => {
    setLoginUsername(uname);
    setLoginPassword('123');
    setLoginError('');
    const user = store.login(uname, '123');
    if (user) {
      if (user.role === 'ADMIN') setActiveTab('overview');
      else if (user.role === 'LEADER') setActiveTab('pending');
      else setActiveTab('my_stories');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword.trim()) return;
    store.changePassword(currentUser.id, newPassword.trim());
    setPasswordSuccess('Đổi mật khẩu thành công!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess('');
      setNewPassword('');
    }, 1500);
  };

  // Story Form Handlers
  const handleStartCreateStory = () => {
    setEditingStoryId(null);
    setStoryTitle('');
    setStoryCategory(categories[0]?.id || '');
    setStoryRiskLevel('CAO');
    setStorySituation('');
    setStoryScamMethod('');
    setStoryWarningSigns(['']);
    setStoryRecommendedAction(['']);
    setStoryLesson('');
    setStoryImageUrl('/src/assets/images/scam_phone_alert_1790138009014.jpg');
    setActiveTab('create_story');
  };

  const handleStartEditStory = (st: Story) => {
    setEditingStoryId(st.id);
    setStoryTitle(st.title);
    setStoryCategory(st.category_id);
    setStoryRiskLevel(st.risk_level);
    setStorySituation(st.situation);
    setStoryScamMethod(st.scam_method);
    setStoryWarningSigns(st.warning_signs.length ? st.warning_signs : ['']);
    setStoryRecommendedAction(
      Array.isArray(st.recommended_action)
        ? st.recommended_action
        : [st.recommended_action]
    );
    setStoryLesson(st.lesson);
    setStoryImageUrl(st.image_url || '');
    setActiveTab('create_story');
  };

  const handleSaveStory = (submitForApproval = false) => {
    if (!storyTitle.trim() || !storySituation.trim()) {
      alert('Vui lòng nhập tên câu chuyện và phần "Chuyện gì đã xảy ra".');
      return;
    }

    const filteredSigns = storyWarningSigns.map(s => s.trim()).filter(Boolean);
    const filteredActions = storyRecommendedAction.map(a => a.trim()).filter(Boolean);

    const storyPayload = {
      title: storyTitle.trim(),
      category_id: storyCategory,
      risk_level: storyRiskLevel,
      situation: storySituation.trim(),
      scam_method: storyScamMethod.trim(),
      warning_signs: filteredSigns.length ? filteredSigns : ['Cảnh giác khi bị ép chuyển tiền gấp'],
      recommended_action: filteredActions.length ? filteredActions : ['Liên hệ ngân hàng xác minh'],
      lesson: storyLesson.trim() || 'Tuyệt đối không chuyển tiền theo yêu cầu người lạ.',
      image_url: storyImageUrl.trim() || undefined,
      author_id: currentUser?.id || 'staff',
      author_name: currentUser?.full_name || 'Cán bộ DVKH',
      status: submitForApproval ? ('PENDING_APPROVAL' as const) : ('DRAFT' as const),
      submitted_at: submitForApproval ? new Date().toISOString() : undefined,
    };

    if (editingStoryId) {
      store.updateStory(editingStoryId, storyPayload);
      alert(submitForApproval ? 'Đã gửi câu chuyện lên lãnh đạo phê duyệt!' : 'Đã lưu bản nháp thành công!');
    } else {
      store.createStory(storyPayload);
      alert(submitForApproval ? 'Đã tạo và gửi câu chuyện lên lãnh đạo phê duyệt!' : 'Đã lưu bản nháp mới!');
    }

    setActiveTab(currentUser?.role === 'ADMIN' ? 'stories' : 'my_stories');
  };

  // Leader Actions
  const handleLeaderApprove = (storyId: string) => {
    if (!currentUser) return;
    store.approveAndPublishStory(storyId, currentUser.full_name);
    alert('Đã phê duyệt và xuất bản câu chuyện thành công!');
  };

  const handleLeaderRejectConfirm = () => {
    if (!revisionStoryId || !currentUser) return;
    if (!revisionNote.trim()) {
      alert('Vui lòng nhập ý kiến yêu cầu chỉnh sửa.');
      return;
    }
    store.rejectStoryWithFeedback(revisionStoryId, currentUser.full_name, revisionNote.trim());
    setRevisionStoryId(null);
    setRevisionNote('');
    alert('Đã gửi yêu cầu chỉnh sửa về cho cán bộ!');
  };

  // Admin settings save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(tempSettings);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  // If user is not logged in, render the login view
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6 border border-slate-200 my-auto">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-700 to-sky-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                CX400
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Đăng nhập cán bộ chi nhánh
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm shadow-lg shadow-blue-700/20 active:scale-95 transition-all"
            >
              Đăng nhập
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold py-2 px-3 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered stories according to roles
  const myStories = stories.filter(s => s.author_id === currentUser.id);
  const pendingStories = stories.filter(s => s.status === 'PENDING_APPROVAL');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Quay lại giao diện khách hàng"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight">
                {currentUser.role === 'STAFF'
                  ? 'CÔNG VIỆC CỦA CÁN BỘ'
                  : currentUser.role === 'LEADER'
                  ? 'PHÊ DUYỆT NỘI DUNG'
                  : 'HỆ THỐNG QUẢN TRỊ CX400'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-600 text-white">
                {currentUser.role}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Xin chào, <strong>{currentUser.full_name}</strong> ({currentUser.department})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Sheets Sync Button (ADMIN ONLY) */}
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={onOpenSheetsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
              title="Đồng bộ dữ liệu với Google Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đồng bộ Sheets</span>
            </button>
          )}

          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
            title="Đổi mật khẩu"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đổi MK</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              store.logout();
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-xs font-bold transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 flex gap-1 overflow-x-auto shrink-0 py-1.5 scrollbar-none">
        {currentUser.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'stories'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Nội dung ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Chờ duyệt ({pendingStories.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Người dùng ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'categories'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Danh mục ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              Cảnh báo ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'quizzes'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              Quiz ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Cài đặt
            </button>
          </>
        )}

        {currentUser.role === 'LEADER' && (
          <>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Nội dung chờ phê duyệt ({pendingStories.length})
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'stories'
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Toàn bộ bài viết ({stories.length})
            </button>
          </>
        )}

        {currentUser.role === 'STAFF' && (
          <>
            <button
              onClick={() => setActiveTab('my_stories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'my_stories'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Bài viết của tôi ({myStories.length})
            </button>
            <button
              onClick={handleStartCreateStory}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'create_story'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              Tạo câu chuyện mới
            </button>
          </>
        )}

        {/* Google Sheets Sync Tab Button (ADMIN ONLY) */}
        {currentUser.role === 'ADMIN' && (
          <button
            onClick={onOpenSheetsModal}
            className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 shrink-0 shadow-2xs"
            title="Đồng bộ dữ liệu trực tuyến qua Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* TAB: OVERVIEW (ADMIN) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-black text-blue-900 font-mono">
                  {analytics.total_views.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Tổng lượt xem bài</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {stories.filter(s => s.status === 'PUBLISHED').length}
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Câu chuyện đã xuất bản</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {pendingStories.length}
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Bài chờ duyệt</div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-2xl font-black text-red-600 font-mono">
                  {analytics.total_sos_clicks}
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-1">Lượt bấm cứu trợ SOS</div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onOpenSheetsModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Đồng bộ Google Sheets
              </button>
              <button
                onClick={handleStartCreateStory}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Thêm câu chuyện
              </button>
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Bell className="w-4 h-4" />
                Phát cảnh báo khẩn
              </button>
              <button
                onClick={() => setShowCatModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <FolderOpen className="w-4 h-4" />
                Thêm danh mục
              </button>
            </div>

            {/* Most Viewed Stories */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                NỘI DUNG ĐƯỢC QUAN TÂM NHIỀU NHẤT
              </h3>
              <div className="divide-y divide-slate-100">
                {stories
                  .slice()
                  .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                  .slice(0, 5)
                  .map(st => (
                    <div key={st.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {st.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {st.author_name} · Trạng thái: {st.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {st.views_count || 0} lượt xem
                        </span>
                        <button
                          onClick={() => onPreviewStory(st)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PENDING APPROVAL (LEADER & ADMIN) */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  NỘI DUNG CHỜ PHÊ DUYỆT
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Xem xét và xuất bản để khách hàng VietinBank Ninh Bình có thể đọc được
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {pendingStories.length} bài đang chờ
              </span>
            </div>

            {pendingStories.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Không có bài viết nào đang chờ duyệt.</p>
                <p className="text-xs text-slate-500 mt-0.5">Tất cả nội dung đã được xử lý xong!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingStories.map(st => (
                  <div
                    key={st.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 uppercase">
                          {categories.find(c => c.id === st.category_id)?.name}
                        </span>
                        <span>·</span>
                        <span className="text-xs text-slate-500">
                          Cán bộ: <strong>{st.author_name}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {st.submitted_at ? new Date(st.submitted_at).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{st.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {st.situation}
                      </p>
                    </div>

                    {/* Action Buttons: Xem, Sửa, Phê duyệt, Yêu cầu chỉnh sửa */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                      <button
                        onClick={() => onPreviewStory(st)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem nội dung
                      </button>

                      <button
                        onClick={() => handleStartEditStory(st)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </button>

                      <button
                        onClick={() => {
                          setRevisionStoryId(st.id);
                          setRevisionNote('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Yêu cầu chỉnh sửa
                      </button>

                      <button
                        onClick={() => handleLeaderApprove(st.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs ml-auto"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Phê duyệt & Xuất bản
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: STORIES LIST (ADMIN / LEADER) */}
        {activeTab === 'stories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">TOÀN BỘ CÂU CHUYỆN</h3>
                <p className="text-xs text-slate-500 font-medium">Quản lý và theo dõi trạng thái xuất bản</p>
              </div>
              <button
                onClick={handleStartCreateStory}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tạo bài mới
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {stories.map(st => (
                <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${
                          st.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : st.status === 'NEED_REVISION'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {st.status === 'PUBLISHED'
                          ? 'Đã xuất bản'
                          : st.status === 'PENDING_APPROVAL'
                          ? 'Chờ duyệt'
                          : st.status === 'NEED_REVISION'
                          ? 'Cần sửa'
                          : 'Bản nháp'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate">{st.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Tác giả: {st.author_name}</span>
                      <span>·</span>
                      <span>Lượt xem: {st.views_count || 0}</span>
                      {st.rejection_note && (
                        <span className="text-red-600 font-semibold truncate max-w-xs">
                          (Lưu ý: {st.rejection_note})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onPreviewStory(st)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                      title="Xem trước"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStartEditStory(st)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                      title="Sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {st.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => store.approveAndPublishStory(st.id, currentUser.full_name)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        title="Xuất bản ngay"
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa câu chuyện "${st.title}"?`)) {
                          store.deleteStory(st.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MY STORIES (STAFF) */}
        {activeTab === 'my_stories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">BÀI VIẾT CỦA TÔI</h3>
                <p className="text-xs text-slate-500 font-medium">Theo dõi các câu chuyện bạn đã biên soạn</p>
              </div>
              <button
                onClick={handleStartCreateStory}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tạo bài mới
              </button>
            </div>

            {myStories.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Bạn chưa tạo câu chuyện nào.</p>
                <button
                  onClick={handleStartCreateStory}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold"
                >
                  Tạo câu chuyện đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myStories.map(st => (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${
                          st.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : st.status === 'NEED_REVISION'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {st.status === 'PUBLISHED'
                          ? '✅ Đã xuất bản'
                          : st.status === 'PENDING_APPROVAL'
                          ? '⏳ Chờ phê duyệt'
                          : st.status === 'NEED_REVISION'
                          ? '↩️ Cần chỉnh sửa'
                          : '📝 Bản nháp'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(st.updated_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{st.title}</h4>

                    {st.rejection_note && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                        <strong>Ý kiến lãnh đạo yêu cầu chỉnh sửa:</strong> {st.rejection_note}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onPreviewStory(st)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem trước
                      </button>

                      <button
                        onClick={() => handleStartEditStory(st)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Sửa bài
                      </button>

                      {st.status !== 'PUBLISHED' && st.status !== 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => {
                            store.submitStoryForApproval(st.id);
                            alert('Đã gửi câu chuyện lên lãnh đạo!');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi duyệt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CREATE / EDIT STORY FORM (STAFF & ADMIN) */}
        {activeTab === 'create_story' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingStoryId ? 'CHỈNH SỬA CÂU CHUYỆN LỪA ĐẢO' : 'TẠO CÂU CHUYỆN MỚI'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Thiết kế trực quan, chia theo các bước dễ đọc cho khách hàng
                </p>
              </div>
              <button
                onClick={() =>
                  setActiveTab(currentUser.role === 'ADMIN' ? 'stories' : 'my_stories')
                }
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Hủy bỏ
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên câu chuyện */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên câu chuyện *
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={e => setStoryTitle(e.target.value)}
                  placeholder='Ví dụ: "Cuộc gọi lúc 10h32: Lệnh bắt của Viện kiểm sát"'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Nhóm lừa đảo & Mức độ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nhóm lừa đảo *
                  </label>
                  <select
                    value={storyCategory}
                    onChange={e => setStoryCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mức độ cảnh báo *
                  </label>
                  <select
                    value={storyRiskLevel}
                    onChange={e => setStoryRiskLevel(e.target.value as RiskLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="RAT_CAO">🔴 Rất cao</option>
                    <option value="CAO">🟠 Cao</option>
                    <option value="TRUNG_BINH">🟡 Cảnh giác / Trung bình</option>
                    <option value="THAP">🟢 Thấp</option>
                  </select>
                </div>
              </div>

              {/* 1. Chuyện gì đã xảy ra? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1️⃣ Chuyện gì đã xảy ra? (Đoạn ngắn 3-4 dòng) *
                </label>
                <textarea
                  rows={3}
                  value={storySituation}
                  onChange={e => setStorySituation(e.target.value)}
                  placeholder="Mô tả hoàn cảnh nạn nhân nhận được cuộc gọi/tin nhắn, không dùng thông tin cá nhân thật..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* 2. Kẻ lừa đảo đã làm gì? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2️⃣ Kẻ lừa đảo đã làm gì? (Từng bước thao túng) *
                </label>
                <textarea
                  rows={4}
                  value={storyScamMethod}
                  onChange={e => setStoryScamMethod(e.target.value)}
                  placeholder="① Gọi điện thoại bất ngờ&#10;② Tạo tâm lý hoảng sợ&#10;③ Yêu cầu giữ bí mật&#10;④ Yêu cầu cài ứng dụng lạ&#10;⑤ Yêu cầu cung cấp OTP..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono text-xs leading-relaxed"
                />
              </div>

              {/* 3. Dấu hiệu nhận biết */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    3️⃣ Dấu hiệu nhận biết chiêu trò
                  </label>
                  <button
                    type="button"
                    onClick={() => setStoryWarningSigns([...storyWarningSigns, ''])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm dấu hiệu
                  </button>
                </div>
                {storyWarningSigns.map((sign, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={sign}
                      onChange={e => {
                        const updated = [...storyWarningSigns];
                        updated[idx] = e.target.value;
                        setStoryWarningSigns(updated);
                      }}
                      placeholder={`Dấu hiệu ${idx + 1}...`}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                    {storyWarningSigns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoryWarningSigns(storyWarningSigns.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 4. Cách xử lý */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    4️⃣ Bạn nên làm gì để tự bảo vệ? (3-5 bước)
                  </label>
                  <button
                    type="button"
                    onClick={() => setStoryRecommendedAction([...storyRecommendedAction, ''])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm bước xử lý
                  </button>
                </div>
                {storyRecommendedAction.map((act, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={act}
                      onChange={e => {
                        const updated = [...storyRecommendedAction];
                        updated[idx] = e.target.value;
                        setStoryRecommendedAction(updated);
                      }}
                      placeholder={`Bước ${idx + 1}...`}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                    {storyRecommendedAction.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoryRecommendedAction(storyRecommendedAction.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 5. Bài học ghi nhớ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5️⃣ Bài học ghi nhớ (Một câu ngắn, ấn tượng) *
                </label>
                <input
                  type="text"
                  value={storyLesson}
                  onChange={e => setStoryLesson(e.target.value)}
                  placeholder='Ví dụ: "Không ai có quyền yêu cầu bạn cung cấp OTP để xác minh tài khoản."'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Hình ảnh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hình ảnh minh họa
                </label>
                <select
                  value={storyImageUrl}
                  onChange={e => setStoryImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="/src/assets/images/scam_phone_alert_1790138009014.jpg">
                    Hình 1: Cảnh báo cuộc gọi lừa đảo (scam_phone_alert)
                  </option>
                  <option value="/src/assets/images/scam_fake_app_1790138021938.jpg">
                    Hình 2: Cài ứng dụng mã độc APK (scam_fake_app)
                  </option>
                  <option value="/src/assets/images/cx400_hero_shield_1790137990354.jpg">
                    Hình 3: Khiên bảo mật công nghệ cao VietinBank
                  </option>
                  <option value="">Không dùng hình ảnh</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveStory(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Lưu bản nháp
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStory(true)}
                  className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-700/20 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Gửi lãnh đạo phê duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: USERS MANAGEMENT (ADMIN) */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">QUẢN LÝ NGƯỜI DÙNG</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Phân quyền Admin, Lãnh đạo phê duyệt và Cán bộ DVKH
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Thêm tài khoản
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {users.map(u => (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{u.full_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        @{u.username}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'LEADER'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.status === 'locked' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                          Đã khóa
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.department}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        store.resetUserPassword(u.id, '123');
                        alert(`Đã đặt lại mật khẩu cho @${u.username} về mặc định "123"!`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1"
                      title="Đặt lại mật khẩu về 123"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Đặt lại MK</span>
                    </button>

                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => store.toggleUserLock(u.id)}
                        className={`p-1.5 rounded-lg text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {u.status === 'active' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CATEGORIES MANAGEMENT (ADMIN) */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">DANH MỤC THỦ ĐOẠN LỪA ĐẢO</h3>
                <p className="text-xs text-slate-500 font-medium">Bổ sung danh mục mới không cần sửa mã nguồn</p>
              </div>
              <button
                onClick={() => setShowCatModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Thêm nhóm
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(c => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa danh mục "${c.name}"?`)) {
                        store.deleteCategory(c.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ALERTS MANAGEMENT (ADMIN) */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">CẢNH BÁO MỚI / KHẨN CẤP</h3>
                <p className="text-xs text-slate-500 font-medium">Hiển thị nổi bật ngay trên trang chủ khách hàng</p>
              </div>
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tạo cảnh báo
              </button>
            </div>

            <div className="space-y-3">
              {alerts.map(a => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${
                        a.risk_level === 'KHAN_CAP'
                          ? 'bg-red-600 text-white'
                          : a.risk_level === 'MOI'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {a.risk_level === 'KHAN_CAP'
                        ? 'CẢNH BÁO KHẨN'
                        : a.risk_level === 'MOI'
                        ? 'CẢNH BÁO MỚI'
                        : 'KHUYẾN NGHỊ'}
                    </span>
                    <button
                      onClick={() => store.deleteAlert(a.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{a.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: QUIZZES MANAGEMENT (ADMIN) */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">NGÂN HÀNG CÂU HỎI QUIZ</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Các câu hỏi trong chuyên mục "Thử thách 60 giây"
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {quizzes.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700">Câu hỏi #{idx + 1}</span>
                    <button
                      onClick={() => store.deleteQuiz(q.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{q.question}</div>
                  <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl">
                    Đáp án đúng: {q.options[q.correct_answer]}
                  </div>
                  <p className="text-[11px] text-slate-500">{q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SETTINGS MANAGEMENT (ADMIN) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-900">CẤU HÌNH HỆ THỐNG CX400</h3>
              <p className="text-xs text-slate-500 font-medium">
                Cập nhật thông tin hotline, địa chỉ và thông điệp an toàn
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                ✅ Đã cập nhật cấu hình hệ thống thành công!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hotline tổng đài 24/7 *
                </label>
                <input
                  type="text"
                  value={tempSettings.hotline_support}
                  onChange={e => setTempSettings({ ...tempSettings, hotline_support: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hotline Chi nhánh Ninh Bình *
                </label>
                <input
                  type="text"
                  value={tempSettings.hotline_branch}
                  onChange={e => setTempSettings({ ...tempSettings, hotline_branch: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên chi nhánh / Đơn vị quản lý
              </label>
              <input
                type="text"
                value={tempSettings.branch_name}
                onChange={e => setTempSettings({ ...tempSettings, branch_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Địa chỉ tiếp nhận xử lý trực tiếp
              </label>
              <input
                type="text"
                value={tempSettings.emergency_address}
                onChange={e => setTempSettings({ ...tempSettings, emergency_address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Thông điệp an ninh bảo mật
              </label>
              <textarea
                rows={2}
                value={tempSettings.security_notice}
                onChange={e => setTempSettings({ ...tempSettings, security_notice: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Khôi phục dữ liệu mẫu ban đầu? Toàn bộ thay đổi thử nghiệm sẽ về mặc định.')) {
                    store.resetToDefault();
                    alert('Đã khôi phục dữ liệu mẫu ban đầu!');
                  }
                }}
                className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Khôi phục dữ liệu mẫu (Reset Demo)
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md shadow-blue-700/20 active:scale-95 transition-all"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal: Leader Revision Note */}
      {revisionStoryId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              Ý kiến chỉ đạo yêu cầu chỉnh sửa
            </h3>
            <p className="text-xs text-slate-500">
              Nhập nội dung cán bộ cần bổ sung trước khi được phê duyệt xuất bản
            </p>
            <textarea
              rows={4}
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              placeholder="Ví dụ: Đề nghị cán bộ bổ sung thêm dấu hiệu lừa đảo và số hotline xử lý kịp thời..."
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRevisionStoryId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleLeaderRejectConfirm}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm active:scale-95"
              >
                Gửi yêu cầu chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form
            onSubmit={handleChangePassword}
            className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-700" />
                Đổi mật khẩu tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold"
              >
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add User */}
      {showUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!userFormUsername || !userFormFullName) return;
              store.addUser({
                username: userFormUsername.trim().toLowerCase(),
                password_hash: '123',
                full_name: userFormFullName.trim(),
                role: userFormRole,
                department: userFormDept.trim(),
                status: 'active',
              });
              setShowUserModal(false);
              setUserFormUsername('');
              setUserFormFullName('');
              alert('Thêm tài khoản thành công! Mật khẩu mặc định là 123');
            }}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Thêm tài khoản cán bộ / lãnh đạo</h3>
              <button type="button" onClick={() => setShowUserModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên đăng nhập (username)
              </label>
              <input
                type="text"
                value={userFormUsername}
                onChange={e => setUserFormUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={userFormFullName}
                onChange={e => setUserFormFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vai trò</label>
                <select
                  value={userFormRole}
                  onChange={e => setUserFormRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="STAFF">CÁN BỘ (STAFF)</option>
                  <option value="LEADER">LÃNH ĐẠO (LEADER)</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng ban</label>
                <input
                  type="text"
                  value={userFormDept}
                  onChange={e => setUserFormDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">Mật khẩu mặc định tạo mới là: <strong>123</strong></p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold"
              >
                Thêm mới
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Category */}
      {showCatModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!catFormName) return;
              store.addCategory({
                name: catFormName.trim(),
                description: catFormDesc.trim(),
                icon: 'AlertTriangle',
                status: 'active',
              });
              setShowCatModal(false);
              setCatFormName('');
              setCatFormDesc('');
            }}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Thêm nhóm lừa đảo mới</h3>
              <button type="button" onClick={() => setShowCatModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên nhóm / Chiêu trò
              </label>
              <input
                type="text"
                value={catFormName}
                onChange={e => setCatFormName(e.target.value)}
                placeholder="Ví dụ: Giả mạo vé xem hòa nhạc..."
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                value={catFormDesc}
                onChange={e => setCatFormDesc(e.target.value)}
                placeholder="Thủ đoạn lừa đảo bán vé chợ đen online..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold"
              >
                Thêm nhóm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Alert */}
      {showAlertModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!alertFormTitle || !alertFormContent) return;
              store.addAlert({
                title: alertFormTitle.trim(),
                content: alertFormContent.trim(),
                risk_level: alertFormRisk,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '2026-12-31',
                status: 'active',
                created_by: currentUser.full_name,
                image_url: '/src/assets/images/scam_fake_app_1790138021938.jpg',
              });
              setShowAlertModal(false);
              setAlertFormTitle('');
              setAlertFormContent('');
              alert('Đã phát cảnh báo mới thành công!');
            }}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Phát cảnh báo khẩn / mới</h3>
              <button type="button" onClick={() => setShowAlertModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mức độ cảnh báo</label>
              <select
                value={alertFormRisk}
                onChange={e => setAlertFormRisk(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="KHAN_CAP">🔴 CẢNH BÁO KHẨN</option>
                <option value="MOI">🟠 CẢNH BÁO MỚI</option>
                <option value="KHUYEN_NGHI">🔵 KHUYẾN NGHỊ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề cảnh báo</label>
              <input
                type="text"
                value={alertFormTitle}
                onChange={e => setAlertFormTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung chi tiết</label>
              <textarea
                rows={3}
                value={alertFormContent}
                onChange={e => setAlertFormContent(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold"
              >
                Phát cảnh báo ngay
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
