const AI_ERROR_MESSAGES_EN = Object.freeze({
  AI_PROVIDER_NOT_CONFIGURED: 'AI Assistant is temporarily unavailable. You can continue with the manual form.',
  AI_PROVIDER_RATE_LIMITED: 'The assistant has reached its current usage limit. Continue manually or try again later.',
  AI_PROVIDER_TIMEOUT: 'The assistant took too long to respond. Retry this message or continue manually.',
  AI_PROVIDER_UNAVAILABLE: 'The assistant is temporarily unavailable.',
  AI_RESPONSE_INVALID: 'The assistant could not understand this request reliably. Try rephrasing it.',
  AI_SESSION_EXPIRED: 'This assistant session has expired. Start a new session or continue manually.',
  AI_SESSION_NOT_FOUND: 'This assistant session is no longer available.',
  AI_ACTIVE_SESSION_LIMIT_REACHED: 'You already have the maximum number of active assistant sessions.',
  AI_MAX_TURNS_REACHED: 'The conversation limit has been reached. Continue with the available draft or use the manual form.',
  AI_MAX_RECALCULATIONS_REACHED: 'The price guidance has reached its recalculation limit.',
  AI_MESSAGE_IDEMPOTENCY_CONFLICT: 'This message retry no longer matches the original message.',
  AI_MESSAGE_PROCESSING: 'Another message is still being processed. The latest session state has been reloaded.',
  AI_SESSION_REVISION_CONFLICT: 'The session changed in another request. The latest state has been reloaded.',
  AI_SESSION_STATE_CHANGED: 'The session changed while the assistant was working. The latest state has been reloaded.',
  AI_SESSION_STATE_INVALID: 'This action is no longer available for the current session.',
  AI_PRICE_DECISION_INVALID: 'This price choice is not valid for the current session.',
  AI_BUDGET_INVALID: 'Enter a valid positive VND budget range.',
  AI_ESTIMATE_NOT_AVAILABLE: 'There is no reliable price range to accept yet.',
  AI_DIAGNOSIS_DECISION_INVALID: 'This diagnosis action is not valid for the current session.',
});

const AI_ERROR_MESSAGES_VI = Object.freeze({
  AI_PROVIDER_NOT_CONFIGURED: 'Trợ lý AI đang tạm thời không khả dụng. Bạn vẫn có thể dùng biểu mẫu thủ công.',
  AI_PROVIDER_RATE_LIMITED: 'Trợ lý AI đã đạt giới hạn sử dụng hiện tại. Hãy thử lại sau hoặc tiếp tục thủ công.',
  AI_PROVIDER_TIMEOUT: 'Trợ lý AI phản hồi quá lâu. Hãy thử gửi lại tin nhắn hoặc tiếp tục thủ công.',
  AI_PROVIDER_UNAVAILABLE: 'Trợ lý AI đang tạm thời không khả dụng.',
  AI_RESPONSE_INVALID: 'Trợ lý AI chưa thể hiểu yêu cầu này một cách đáng tin cậy. Hãy diễn đạt lại.',
  AI_SESSION_EXPIRED: 'Phiên trợ lý AI đã hết hạn. Hãy bắt đầu phiên mới hoặc tiếp tục thủ công.',
  AI_SESSION_NOT_FOUND: 'Phiên trợ lý AI này không còn khả dụng.',
  AI_ACTIVE_SESSION_LIMIT_REACHED: 'Bạn đã đạt số phiên trợ lý AI đang hoạt động tối đa.',
  AI_MAX_TURNS_REACHED: 'Cuộc trò chuyện đã đạt giới hạn. Hãy dùng thông tin hiện có hoặc chuyển sang biểu mẫu thủ công.',
  AI_MAX_RECALCULATIONS_REACHED: 'Hướng dẫn giá đã đạt giới hạn tính lại.',
  AI_MESSAGE_IDEMPOTENCY_CONFLICT: 'Tin nhắn gửi lại không còn khớp với nội dung ban đầu.',
  AI_MESSAGE_PROCESSING: 'Một tin nhắn khác đang được xử lý. Trạng thái mới nhất đã được tải lại.',
  AI_SESSION_REVISION_CONFLICT: 'Phiên đã thay đổi ở yêu cầu khác. Trạng thái mới nhất đã được tải lại.',
  AI_SESSION_STATE_CHANGED: 'Phiên đã thay đổi trong lúc trợ lý xử lý. Trạng thái mới nhất đã được tải lại.',
  AI_SESSION_STATE_INVALID: 'Thao tác này không còn khả dụng ở trạng thái hiện tại.',
  AI_PRICE_DECISION_INVALID: 'Lựa chọn giá không hợp lệ cho phiên hiện tại.',
  AI_BUDGET_INVALID: 'Hãy nhập khoảng ngân sách VND nguyên dương hợp lệ.',
  AI_ESTIMATE_NOT_AVAILABLE: 'Chưa có khoảng giá đủ tin cậy để xác nhận.',
  AI_DIAGNOSIS_DECISION_INVALID: 'Thao tác xác nhận thông tin không hợp lệ cho phiên hiện tại.',
});

const AI_COPY = Object.freeze({
  EN: {
    pageTitle: 'Describe your problem',
    pageSubtitle: 'The assistant will help identify the service, ask a few questions and prepare a Job draft.',
    textAssistant: 'Text assistant',
    aiAssistant: 'AI Assistant',
    manualForm: 'Manual Form',
    skipAi: 'Skip AI and fill manually',
    preparing: 'Preparing your assistant…',
    unavailableTitle: 'AI Assistant is not available right now',
    tryAgain: 'Try again',
    useManual: 'Use Manual Form',
    startOverConfirm: 'Start a new assistant session? The current conversation will become read-only history.',
    sessionCloseFailed: 'The current assistant session could not be closed. Refresh and try again.',
    conversationLabel: 'Conversation with AI Job Assistant',
    startOver: 'Start over',
    assistant: 'Assistant',
    you: 'You',
    emptyPrompt: 'Describe what is happening, when it occurs and anything you have already noticed.',
    failedMessage: 'The assistant did not finish this message.',
    retry: 'Retry',
    analyzing: 'Analyzing your description…',
    composerLabel: 'Describe your problem',
    composerPlaceholder: 'Add details about the issue…',
    correctionPlaceholder: 'Describe what should be added, removed or corrected…',
    composerLocked: 'The draft is ready. Continue to the Job form or edit the diagnosis.',
    send: 'Send',
    composerHelp: 'Press Enter to send. Use Shift+Enter for a new line.',
    correctionHelp: 'Explain what is incorrect or missing. The assistant will prepare a new confirmation summary.',
    draftTitle: 'Job draft',
    draftReady: 'Ready for your confirmation',
    draftBuilding: 'Built from the conversation',
    service: 'Service',
    waiting: 'Waiting for more information.',
    problemSummary: 'Problem summary',
    summaryPlaceholder: 'The assistant will prepare a concise description.',
    diagnosisTitle: 'Review diagnosis',
    diagnosisPrompt: 'Check the extracted information before price guidance is calculated.',
    diagnosisConfirmed: 'Information confirmed',
    device: 'Device or work area',
    mainProblem: 'Main problem',
    symptoms: 'Relevant symptoms',
    age: 'Age or usage duration',
    severity: 'Severity',
    urgency: 'Urgency',
    normalizedDescription: 'Normalized Job description',
    confirmDiagnosis: 'Confirm information',
    correctDiagnosis: 'Add or correct information',
    editDiagnosis: 'Edit diagnosis',
    priceChoice: 'Your price choice',
    continueWithoutPrice: 'Continue without price guidance',
    chooseNext: 'Choose your next step',
    acceptSuggestion: 'Use suggested range',
    recalculate: 'Clarify and recalculate',
    ownBudget: 'Use my own budget',
    continueToForm: 'Continue to Job Form',
    formReminder: 'You will confirm the address, GPS, schedule and optional images before posting.',
    guidanceTitle: 'AI price guidance',
    guidanceSubtitle: 'Historical selected Bids for comparable completed Jobs',
    suggestedRange: 'Suggested range',
    typicalAmount: 'Typical amount',
    lowConfidence: 'Low confidence',
    mediumConfidence: 'Medium confidence',
    basedOn: (count) => `Based on ${count} comparable completed ${count === 1 ? 'Job' : 'Jobs'}`,
    insufficient: 'Not enough comparable completed Jobs to calculate a reliable range.',
    validSamples: (count) => `${count} valid ${count === 1 ? 'sample was' : 'samples were'} found.`,
    referenceOnly: 'Reference only — the Customer budget and Handyman Bid remain independent.',
    manualTitle: 'Confirm and post your Job',
    manualPrefilled: 'The approved AI draft is prefilled below. Confirm every field before posting.',
    manualDescription: 'Complete the existing Job form without using the assistant.',
    returnToAi: 'Return to AI Assistant',
    preparingState: 'Preparing your assistant',
    draftReadyState: 'Draft ready',
    guidanceReadyState: 'Price guidance ready',
    reviewState: 'Review the diagnosis',
    expiredState: 'Session expired',
    closedState: 'Session closed',
    appliedState: 'Applied to Job',
    needsInfoState: 'Needs more information',
    understandingState: 'Understanding your issue',
  },
  VI: {
    pageTitle: 'Mô tả sự cố của bạn',
    pageSubtitle: 'Trợ lý sẽ giúp xác định dịch vụ, hỏi thêm thông tin cần thiết và chuẩn bị bản nháp Job.',
    textAssistant: 'Trợ lý văn bản',
    aiAssistant: 'Trợ lý AI',
    manualForm: 'Biểu mẫu thủ công',
    skipAi: 'Bỏ qua AI và điền thủ công',
    preparing: 'Đang chuẩn bị trợ lý…',
    unavailableTitle: 'Trợ lý AI hiện không khả dụng',
    tryAgain: 'Thử lại',
    useManual: 'Dùng biểu mẫu thủ công',
    startOverConfirm: 'Bắt đầu một phiên trợ lý mới? Cuộc trò chuyện hiện tại sẽ trở thành lịch sử chỉ đọc.',
    sessionCloseFailed: 'Không thể đóng phiên trợ lý hiện tại. Hãy tải lại trang và thử lại.',
    conversationLabel: 'Cuộc trò chuyện với Trợ lý AI',
    startOver: 'Bắt đầu lại',
    assistant: 'Trợ lý',
    you: 'Bạn',
    emptyPrompt: 'Hãy mô tả sự cố, thời điểm xảy ra và những dấu hiệu bạn đã nhận thấy.',
    failedMessage: 'Trợ lý chưa xử lý xong tin nhắn này.',
    retry: 'Thử lại',
    analyzing: 'Đang phân tích mô tả…',
    composerLabel: 'Mô tả sự cố',
    composerPlaceholder: 'Bổ sung thông tin về sự cố…',
    correctionPlaceholder: 'Mô tả thông tin cần bổ sung, loại bỏ hoặc chỉnh sửa…',
    composerLocked: 'Bản nháp đã sẵn sàng. Bạn có thể tiếp tục đến biểu mẫu đăng Job hoặc chỉnh sửa lại thông tin.',
    send: 'Gửi',
    composerHelp: 'Nhấn Enter để gửi. Dùng Shift+Enter để xuống dòng.',
    correctionHelp: 'Hãy cho biết thông tin nào chưa đúng hoặc còn thiếu. Trợ lý sẽ tạo lại bản xác nhận.',
    draftTitle: 'Bản nháp Job',
    draftReady: 'Sẵn sàng để bạn xác nhận',
    draftBuilding: 'Được tổng hợp từ cuộc trò chuyện',
    service: 'Dịch vụ',
    waiting: 'Đang chờ thêm thông tin.',
    problemSummary: 'Tóm tắt vấn đề',
    summaryPlaceholder: 'Trợ lý sẽ chuẩn hóa mô tả ngắn gọn.',
    diagnosisTitle: 'Xác nhận thông tin',
    diagnosisPrompt: 'Kiểm tra thông tin được tổng hợp trước khi hệ thống tính hướng dẫn giá.',
    diagnosisConfirmed: 'Thông tin đã được xác nhận',
    device: 'Thiết bị hoặc khu vực làm việc',
    mainProblem: 'Vấn đề chính',
    symptoms: 'Dấu hiệu liên quan',
    age: 'Thời gian sử dụng',
    severity: 'Mức độ',
    urgency: 'Độ khẩn cấp',
    normalizedDescription: 'Mô tả Job đã chuẩn hóa',
    confirmDiagnosis: 'Xác nhận thông tin',
    correctDiagnosis: 'Bổ sung hoặc chỉnh sửa',
    editDiagnosis: 'Chỉnh sửa thông tin',
    priceChoice: 'Lựa chọn giá của bạn',
    continueWithoutPrice: 'Tiếp tục không dùng hướng dẫn giá',
    chooseNext: 'Chọn bước tiếp theo',
    acceptSuggestion: 'Dùng khoảng giá đề xuất',
    recalculate: 'Bổ sung và tính lại',
    ownBudget: 'Dùng ngân sách của tôi',
    continueToForm: 'Tiếp tục đến biểu mẫu Job',
    formReminder: 'Bạn vẫn cần xác nhận địa chỉ, GPS, lịch thực hiện và hình ảnh tùy chọn trước khi đăng.',
    guidanceTitle: 'Hướng dẫn giá AI',
    guidanceSubtitle: 'Dựa trên Bid được chọn của các Job tương tự đã hoàn thành',
    suggestedRange: 'Khoảng giá đề xuất',
    typicalAmount: 'Mức giá điển hình',
    lowConfidence: 'Độ tin cậy thấp',
    mediumConfidence: 'Độ tin cậy trung bình',
    basedOn: (count) => `Dựa trên ${count} Job tương tự đã hoàn thành`,
    insufficient: 'Chưa có đủ Job tương tự đã hoàn thành để tính khoảng giá đáng tin cậy.',
    validSamples: (count) => `Tìm thấy ${count} mẫu hợp lệ.`,
    referenceOnly: 'Chỉ để tham khảo — ngân sách Customer và Bid của Handyman vẫn độc lập.',
    manualTitle: 'Xác nhận và đăng Job',
    manualPrefilled: 'Bản nháp AI đã được điền bên dưới. Hãy xác nhận từng trường trước khi đăng.',
    manualDescription: 'Hoàn thành biểu mẫu Job hiện tại mà không dùng trợ lý.',
    returnToAi: 'Quay lại Trợ lý AI',
    preparingState: 'Đang chuẩn bị trợ lý',
    draftReadyState: 'Bản nháp đã sẵn sàng',
    guidanceReadyState: 'Hướng dẫn giá đã sẵn sàng',
    reviewState: 'Đang chờ xác nhận thông tin',
    expiredState: 'Phiên đã hết hạn',
    closedState: 'Phiên đã đóng',
    appliedState: 'Đã áp dụng vào Job',
    needsInfoState: 'Cần thêm thông tin',
    understandingState: 'Đang tìm hiểu sự cố',
  },
});

const REVISION_ERROR_CODES = new Set([
  'AI_MESSAGE_PROCESSING',
  'AI_SESSION_REVISION_CONFLICT',
  'AI_SESSION_STATE_CHANGED',
  'AI_SESSION_STATE_INVALID',
]);

const getAiErrorCode = (error) => error?.code
  || error?.response?.data?.code
  || 'AI_REQUEST_FAILED';

const getConversationLanguage = (session) => (
  session?.conversation_language === 'EN' ? 'EN' : 'VI'
);

const getAiCopy = (language) => AI_COPY[language === 'EN' ? 'EN' : 'VI'];

const getAiErrorMessage = (error, language = 'VI') => (
  (language === 'EN' ? AI_ERROR_MESSAGES_EN : AI_ERROR_MESSAGES_VI)[getAiErrorCode(error)]
  || error?.EM
  || error?.response?.data?.EM
  || (language === 'EN'
    ? 'The AI Assistant request could not be completed.'
    : 'Không thể hoàn thành yêu cầu với Trợ lý AI.')
);

const createStableUuid = () => {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const formatVndAmount = (value, fallback = 'Not available') => {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    return fallback;
  }
  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) return fallback;
  try {
    return `${new Intl.NumberFormat('en-US').format(BigInt(normalized))} VND`;
  } catch {
    return fallback;
  }
};

const formatGuidanceRange = (guidance) => {
  if (!guidance?.suggested_min_amount || !guidance?.suggested_max_amount) return null;
  return `${formatVndAmount(guidance.suggested_min_amount)} – ${formatVndAmount(guidance.suggested_max_amount)}`;
};

const getConfidenceLabel = (confidence, language = 'EN') => {
  const copy = getAiCopy(language);
  return ({
    LOW: copy.lowConfidence,
    MEDIUM: copy.mediumConfidence,
  }[confidence] || null);
};

const getSessionStateLabel = (session, language = getConversationLanguage(session)) => {
  const copy = getAiCopy(language);
  if (!session) return copy.preparingState;
  if (session.status === 'DRAFT_READY') return copy.draftReadyState;
  if (session.status === 'ESTIMATE_PRESENTED') return copy.guidanceReadyState;
  if (session.stage === 'REVIEW_DIAGNOSIS') return copy.reviewState;
  if (session.status === 'EXPIRED') return copy.expiredState;
  if (session.status === 'ABANDONED') return copy.closedState;
  if (session.status === 'APPLIED_TO_JOB') return copy.appliedState;
  if (session.stage === 'CLARIFYING') return copy.needsInfoState;
  return copy.understandingState;
};

export {
  REVISION_ERROR_CODES,
  createStableUuid,
  formatGuidanceRange,
  formatVndAmount,
  getAiCopy,
  getAiErrorCode,
  getAiErrorMessage,
  getConfidenceLabel,
  getConversationLanguage,
  getSessionStateLabel,
};
