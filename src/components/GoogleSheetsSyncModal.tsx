import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  X,
  Plus,
  Link as LinkIcon,
  ShieldCheck,
  Clock,
  Sparkles,
  HelpCircle,
  Code,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  initAuth,
} from '../services/googleAuth';
import {
  createGoogleSpreadsheet,
  getStoredSheetConfig,
  saveStoredSheetConfig,
  pushAllDataToSheet,
  pullAllDataFromSheet,
  DEFAULT_APPS_SCRIPT_URL,
  getAppsScriptUrl,
  saveAppsScriptUrl,
  pullDataFromAppsScript,
  processSyncQueue,
} from '../services/googleSheets';
import { store, useStore } from '../services/store';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptCode';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleSheetsSyncModal({ isOpen, onClose }: GoogleSheetsSyncModalProps) {
  const { stories, categories, alerts, quizzes, settings, analytics, lastSyncTime } = useStore();

  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheet configuration
  const [sheetConfig, setSheetConfig] = useState<{
    spreadsheetId: string;
    title: string;
    url: string;
  } | null>(getStoredSheetConfig());

  // Input for existing spreadsheet
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Confirmation Modal state for destructive/updating actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'push' | 'pull' | 'disconnect';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'push',
  });

  // Google Apps Script Modal state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Google Apps Script Web App Link state
  const [appsScriptUrl, setAppsScriptUrl] = useState(getAppsScriptUrl());
  const [copiedScriptUrl, setCopiedScriptUrl] = useState(false);
  const [isEditingScriptUrl, setIsEditingScriptUrl] = useState(false);
  const [customScriptInput, setCustomScriptInput] = useState(getAppsScriptUrl());

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveScriptUrl = () => {
    const trimmed = customScriptInput.trim();
    if (!trimmed) {
      saveAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
      setAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
      setCustomScriptInput(DEFAULT_APPS_SCRIPT_URL);
    } else {
      saveAppsScriptUrl(trimmed);
      setAppsScriptUrl(trimmed);
    }
    setIsEditingScriptUrl(false);
    setSyncStatus({
      type: 'info',
      message: 'Đã lưu đường dẫn Google Apps Script Web App.',
    });
  };

  const handleResetDefaultScriptUrl = () => {
    saveAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    setAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    setCustomScriptInput(DEFAULT_APPS_SCRIPT_URL);
    setIsEditingScriptUrl(false);
    setSyncStatus({
      type: 'info',
      message: 'Đã khôi phục link Google Apps Script mặc định của Chi nhánh Ninh Bình.',
    });
  };

  const handleFastSyncFromAppsScript = async () => {
    setIsSyncing(true);
    setSyncStatus({
      type: 'info',
      message: 'Đang kết nối tới Google Apps Script Web App để nạp dữ liệu...',
    });

    try {
      const data = await pullDataFromAppsScript(appsScriptUrl);
      store.applySheetImport({
        stories: data.stories,
        categories: data.categories,
        alerts: data.alerts,
        quizzes: data.quizzes,
        customerSubmissions: data.customer_submissions,
        settings: data.settings,
        analytics: data.analytics,
        quizResults: data.quiz_results,
        auditLogs: data.audit_logs,
      });
      // Also process pending sync queue if any
      const queueRes = await processSyncQueue();
      setSyncStatus({
        type: 'success',
        message: `Đồng bộ thành công! Đã nạp ${data.stories?.length || 0} bài học, ${data.customer_submissions?.length || 0} câu chuyện khách hàng, ${data.alerts?.length || 0} cảnh báo, ${data.quizzes?.length || 0} câu hỏi trắc nghiệm, ${data.quiz_results?.length || 0} kết quả quiz. (Đã xử lý ${queueRes.processedCount} lệnh đợi)`,
      });
    } catch (err: any) {
      console.error('Fast sync error:', err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Lỗi khi đồng bộ từ Google Apps Script Web App.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
        setAuthError(null);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );

    // Initial check for existing token in memory
    getAccessToken().then(t => {
      if (t) setToken(t);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
        setSyncStatus({
          type: 'info',
          message: `Đã kết nối thành công với tài khoản ${res.user.email}`,
        });
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Không thể đăng nhập tài khoản Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google Sign Out
  const handleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setToken(null);
    setSyncStatus({
      type: 'info',
      message: 'Đã ngắt kết nối tài khoản Google.',
    });
  };

  // Create a new Google Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!token) {
      await handleSignIn();
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const newConfig = await createGoogleSpreadsheet();
      setSheetConfig(newConfig);

      // Immediately push current local data to this new sheet
      await pushAllDataToSheet(newConfig.spreadsheetId, {
        stories,
        customerSubmissions: store.getCustomerSubmissions(),
        categories,
        alerts,
        quizzes,
        settings,
        analytics,
        quizResults: store.getQuizResults(),
        auditLogs: store.getAuditLogs(),
      });
      await processSyncQueue(newConfig.spreadsheetId);
      store.setLastSyncTime(new Date().toISOString());

      setSyncStatus({
        type: 'success',
        message: 'Đã tạo mới và đồng bộ toàn bộ dữ liệu lên Google Sheet thành công!',
      });
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Lỗi khi khởi tạo Google Spreadsheet.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect to an existing Google Spreadsheet URL or ID
  const handleConnectExistingSheet = () => {
    if (!customSheetInput.trim()) return;

    let id = customSheetInput.trim();
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    const config = {
      spreadsheetId: id,
      title: 'Google Spreadsheet VietinBank CX400',
      url: `https://docs.google.com/spreadsheets/d/${id}`,
    };

    setSheetConfig(config);
    saveStoredSheetConfig(config);
    setShowCustomInput(false);
    setCustomSheetInput('');
    setSyncStatus({
      type: 'info',
      message: `Đã kết nối với bảng tính: ${id}`,
    });
  };

  // Request Confirmation before Push
  const requestPushConfirmation = () => {
    if (!sheetConfig) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận đồng bộ lên Google Sheet',
      message: `Hành động này sẽ ghi đè dữ liệu trên Google Sheet "${sheetConfig.title}" với dữ liệu hiện tại từ ứng dụng (gồm ${stories.length} câu chuyện, ${categories.length} danh mục, ${alerts.length} cảnh báo, ${quizzes.length} câu hỏi quiz). Bạn có chắc chắn muốn thực hiện?`,
      actionType: 'push',
    });
  };

  // Request Confirmation before Pull
  const requestPullConfirmation = () => {
    if (!sheetConfig) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận kéo dữ liệu về Ứng dụng',
      message: `Hành động này sẽ tải toàn bộ câu chuyện, danh mục, cảnh báo, quiz và cấu hình từ Google Sheet về máy để thay thế dữ liệu cục bộ hiện tại. Bạn có chắc chắn muốn tiếp tục?`,
      actionType: 'pull',
    });
  };

  // Execute confirmed action
  const handleExecuteConfirmedAction = async () => {
    const { actionType } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    if (!sheetConfig) return;

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      if (actionType === 'push') {
        await pushAllDataToSheet(sheetConfig.spreadsheetId, {
          stories,
          customerSubmissions: store.getCustomerSubmissions(),
          categories,
          alerts,
          quizzes,
          settings,
          analytics,
          quizResults: store.getQuizResults(),
          auditLogs: store.getAuditLogs(),
        });
        const queueRes = await processSyncQueue(sheetConfig.spreadsheetId);
        store.setLastSyncTime(new Date().toISOString());
        setSyncStatus({
          type: 'success',
          message: `Đã đẩy toàn bộ dữ liệu lên Google Sheet thành công (cập nhật theo cơ chế Upsert ID, đã đồng bộ ${queueRes.processedCount} lệnh đợi)!`,
        });
      } else if (actionType === 'pull') {
        const imported = await pullAllDataFromSheet(sheetConfig.spreadsheetId);
        store.applySheetImport(imported);
        const queueRes = await processSyncQueue(sheetConfig.spreadsheetId);
        setSyncStatus({
          type: 'success',
          message: `Đồng bộ thành công! Đã nạp ${imported.stories.length} câu chuyện, ${imported.customerSubmissions?.length || 0} câu chuyện khách hàng, ${imported.categories.length} danh mục, ${imported.alerts.length} cảnh báo, ${imported.quizResults?.length || 0} kết quả quiz từ Google Sheet.`,
        });
      } else if (actionType === 'disconnect') {
        saveStoredSheetConfig(null);
        setSheetConfig(null);
        setSyncStatus({
          type: 'info',
          message: 'Đã ngắt kết nối với Google Sheet.',
        });
      }
    } catch (err: any) {
      console.error('Sync execution error:', err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Lỗi trong quá trình đồng bộ dữ liệu.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Đồng bộ Google Sheets
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Chi nhánh VietinBank Ninh Bình · Quản trị dữ liệu trực tuyến
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Status Message */}
          {syncStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : syncStatus.type === 'error'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-blue-50 text-blue-900 border border-blue-200'
              }`}
            >
              {syncStatus.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {syncStatus.type === 'error' && (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              {syncStatus.type === 'info' && (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed">{syncStatus.message}</span>
            </div>
          )}

          {/* GOOGLE APPS SCRIPT WEB APP DEFAULT LINK CARD */}
          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-blue-950">
                    Link Web App Google Sheet Mặc Định
                  </h4>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    Chi nhánh VietinBank Ninh Bình
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                🟢 Đã liên kết mặc định
              </span>
            </div>

            {/* URL Display / Edit Field */}
            {isEditingScriptUrl ? (
              <div className="space-y-2 animate-in fade-in">
                <input
                  type="text"
                  value={customScriptInput}
                  onChange={e => setCustomScriptInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs border border-blue-300 rounded-xl focus:outline-hidden focus:border-blue-600 bg-white"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={handleResetDefaultScriptUrl}
                    className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-blue-700 font-semibold"
                  >
                    Khôi phục mặc định
                  </button>
                  <button
                    onClick={() => setIsEditingScriptUrl(false)}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveScriptUrl}
                    className="px-3.5 py-1 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 shadow-xs"
                  >
                    Lưu link mới
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-white border border-blue-200/90 font-mono text-[11px] text-slate-800 shadow-2xs">
                <span className="truncate flex-1 font-semibold">{appsScriptUrl}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptUrl);
                      setCopiedScriptUrl(true);
                      setTimeout(() => setCopiedScriptUrl(false), 2000);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    title="Sao chép liên kết Web App"
                  >
                    {copiedScriptUrl ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setCustomScriptInput(appsScriptUrl);
                      setIsEditingScriptUrl(true);
                    }}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Đổi link
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
              <button
                onClick={handleFastSyncFromAppsScript}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>Đồng bộ nhanh từ Web App này</span>
              </button>

              <a
                href={appsScriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                title="Mở đường link trên tab mới để kiểm tra kết quả JSON"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Kiểm tra link</span>
              </a>
            </div>
          </div>

          {/* SYNC QUEUE & METRICS OVERVIEW */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Tình huống</span>
                <span className="text-sm font-black text-slate-800">{stories.length}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Chia sẻ KH</span>
                <span className="text-sm font-black text-slate-800">{store.getCustomerSubmissions().length}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kết quả Quiz</span>
                <span className="text-sm font-black text-[#004B87]">{store.getQuizResults().length}</span>
              </div>
              <div
                className={`p-2.5 rounded-2xl border ${
                  store.getSyncQueue().length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block">Chờ đồng bộ</span>
                <span className="text-sm font-black">{store.getSyncQueue().length}</span>
              </div>
            </div>

            {store.getSyncQueue().length > 0 && (
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  const res = await processSyncQueue();
                  setIsSyncing(false);
                  setSyncStatus({
                    type: 'success',
                    message: `Đã xử lý ${res.processedCount} bản ghi trong hàng đợi đồng bộ.`,
                  });
                }}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ ngay {store.getSyncQueue().length} bản ghi đang chờ</span>
              </button>
            )}
          </div>

          {/* STEP 1: Google Account Authentication */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Tài khoản Google kết nối
              </span>
              {googleUser && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Đã xác thực
                </span>
              )}
            </div>

            {googleUser ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                      {(googleUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {googleUser.displayName || 'Người dùng Google'}
                    </div>
                    <div className="text-[11px] text-slate-500">{googleUser.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Để đồng bộ dữ liệu hai chiều với Google Sheets, vui lòng đăng nhập tài khoản Google của bạn:
                </p>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                    {authError}
                  </div>
                )}

                {/* Standard "Sign in with Google" Material Button as required */}
                <div>
                  <button
                    onClick={handleSignIn}
                    disabled={isAuthenticating}
                    className="gsi-material-button w-full justify-center shadow-xs hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          style={{ display: 'block' }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          ></path>
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          ></path>
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          ></path>
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          ></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents font-semibold text-slate-800">
                        {isAuthenticating ? 'Đang xác thực...' : 'Đăng nhập với Google (Sign in with Google)'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Google Spreadsheet Selection / Creation */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Bảng tính Google Sheet
            </span>

            {sheetConfig ? (
              <div className="space-y-2.5">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        {sheetConfig.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs mt-0.5">
                        ID: {sheetConfig.spreadsheetId}
                      </div>
                    </div>
                    <a
                      href={sheetConfig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-colors shrink-0"
                    >
                      <span>Mở Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Đồng bộ gần nhất:</span>
                      <span className="font-semibold text-slate-700">
                        {lastSyncTime ? new Date(lastSyncTime).toLocaleString('vi-VN') : 'Chưa đồng bộ'}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'Ngắt kết nối Bảng tính',
                          message: 'Bạn có muốn ngắt liên kết với bảng tính Google Sheet hiện tại? Dữ liệu cục bộ trên máy sẽ không bị mất.',
                          actionType: 'disconnect',
                        })
                      }
                      className="text-slate-400 hover:text-red-600 font-medium"
                    >
                      Đổi bảng tính
                    </button>
                  </div>
                </div>

                {/* 2-Way Sync Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Push to Sheet */}
                  <button
                    onClick={requestPushConfirmation}
                    disabled={isSyncing || !googleUser}
                    className="p-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Đẩy dữ liệu lên Google Sheet</span>
                  </button>

                  {/* Pull from Sheet */}
                  <button
                    onClick={requestPullConfirmation}
                    disabled={isSyncing || !googleUser}
                    className="p-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Kéo dữ liệu từ Sheet về máy</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Chưa có bảng tính nào được liên kết. Bạn có thể tự động tạo mới hoặc nhập ID bảng tính có sẵn:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isSyncing || !googleUser}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Tự động tạo Google Sheet mới</span>
                  </button>

                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className="py-3 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Nhập URL có sẵn</span>
                  </button>
                </div>

                {showCustomInput && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                    <label className="text-[11px] font-bold text-slate-700">
                      Dán link hoặc ID Google Spreadsheet:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSheetInput}
                        onChange={e => setCustomSheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1A2b3C... hoặc ID"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                      <button
                        onClick={handleConnectExistingSheet}
                        className="px-3.5 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors shrink-0"
                      >
                        Kết nối
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: Current Data Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Cấu trúc dữ liệu được đồng bộ (6 Sheet)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">📖 Cau_Chuyen</div>
                <div className="text-lg font-black text-slate-900">{stories.length} bài</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">🗂️ Danh_Muc</div>
                <div className="text-lg font-black text-slate-900">{categories.length} nhóm</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">🚨 Canh_Bao</div>
                <div className="text-lg font-black text-slate-900">{alerts.length} tin</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">🧠 Quiz</div>
                <div className="text-lg font-black text-slate-900">{quizzes.length} câu</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">⚙️ Cai_Dat</div>
                <div className="text-lg font-black text-slate-900">Chi nhánh</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-xs font-bold text-slate-500">📊 Thong_Ke</div>
                <div className="text-lg font-black text-slate-900">{analytics.total_views} lượt</div>
              </div>
            </div>
          </div>

          {/* STEP 4: Google Apps Script Extension Code */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4. Mã Google Apps Script cho Bảng tính
              </span>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Xem & Copy Code Script</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tích hợp Menu quản trị <strong>🛡️ VIETINBANK CX400</strong> trực tiếp trong Google Sheet: Tự động tô màu chuẩn VietinBank, kiểm tra lỗi dữ liệu và tạo dòng mẫu nhanh chóng.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xác thực an toàn qua Google OAuth 2.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Explicit Confirmation Dialog (Mandatory for mutating/updating data as per guidelines) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.actionType === 'disconnect'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">{confirmModal.title}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteConfirmedAction}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all active:scale-95 ${
                  confirmModal.actionType === 'disconnect'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                    : 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
                }`}
              >
                Xác nhận thực hiện
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Apps Script Modal Viewer & Copy */}
      {showScriptModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Google Apps Script cho Bảng tính CX400
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Menu VietinBank · Tô màu tự động · Kiểm tra hợp lệ · API Web App
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowScriptModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Instructions Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2 text-xs text-blue-950 font-medium">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  Hướng dẫn 4 bước cài đặt vào Google Sheet:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90 leading-relaxed pl-1">
                  <li>Mở file Google Sheet của bạn trên trình duyệt máy tính.</li>
                  <li>Trên thanh menu trên cùng, chọn: <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Xóa đoạn code mẫu trong file <code>Code.gs</code> và dán toàn bộ đoạn mã bên dưới vào.</li>
                  <li>Nhấn nút <strong>Lưu dự án (Save)</strong> (💾 hoặc phím <code>Ctrl + S</code>) rồi tải lại trang Google Sheet.</li>
                </ol>
              </div>

              {/* Action Button: Copy */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mã nguồn Script (Code.gs):
                </span>
                <button
                  onClick={handleCopyScript}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Đã sao chép vào bộ nhớ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Sao chép toàn bộ mã</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display */}
              <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs max-h-80 overflow-y-auto border border-slate-800 scrollbar-thin">
                <pre className="whitespace-pre">{GOOGLE_APPS_SCRIPT_CODE}</pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Tập tin lưu trữ tại: <code>google-apps-script.js</code>
              </span>
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
