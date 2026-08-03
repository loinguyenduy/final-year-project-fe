# Manual frontend test: IN_PROGRESS → WARRANTY → CLOSED

Tài liệu này dùng để kiểm thử thủ công lifecycle workspace cho Customer và selected Handyman.
Chỉ chạy SQL chuyển trạng thái trên database development/test. Không dùng dữ liệu thật.

Frontend phải lấy `accepted-details` làm canonical state: `job.status` chọn stage,
`warranty.status` chọn substage và `allowed_actions` quyết định action được phép hiển thị.
Socket event chỉ là tín hiệu để refetch; UI không tự suy diễn trạng thái từ event hoặc countdown.

## 1. Chuẩn bị

- Chạy frontend và backend với schema Completion/Warranty đã rollout.
- Chuẩn bị hai browser profile độc lập:
  - Customer owner của Job.
  - selected Handyman của cùng Job.
- Có thể chuẩn bị thêm một user không thuộc Job để kiểm tra quyền ở backend/Postman; frontend
  lifecycle route chỉ cần hai role hợp lệ.
- Bắt đầu bằng Job `IN_PROGRESS`, Contract active, deposit đã thanh toán đủ và Chat `ACTIVE`.
- Chuẩn bị ít nhất 12 JPEG/PNG khác nhau, một WebP và một file lớn hơn 5 MB.
- Mở DevTools ở cả hai browser, bật Preserve log cho Network, Console và Socket.IO frames.
- Tắt cache trong lúc DevTools mở để dễ xác nhận request canonical.
- Dùng backend guide
  `../final-year-project-be/docs/manual-backend-in-progress-warranty-test.md` để tạo dữ liệu,
  chạy Admin SQL và cấu hình warranty expiry ngắn trong development.

URL chuẩn:

```text
/jobs/<jobId>/lifecycle
```

Mỗi mutation thành công phải được kiểm tra ở ba lớp:

1. Response mutation thành công, không gửi request trùng do double click.
2. Frontend gọi lại `GET /matchmaking/jobs/<jobId>/accepted-details` và resource phụ liên quan.
3. UI cuối cùng khớp canonical `status`, `warranty.status` và `allowed_actions` vừa nhận.

## 2. Smoke test workspace và responsive layout

- Mở trực tiếp URL lifecycle ở `IN_PROGRESS`, `WARRANTY` và `CLOSED`; refresh mỗi URL.
- Expected: không redirect sang legacy details; cùng header, progress stepper, role theme và Job
  context hiện có được giữ nguyên.
- Stepper phải đánh dấu đúng `In Progress`, `Warranty`, rồi `Completed` theo canonical status.
- Desktop ở 1024×768, 1366×768 và 1440×900:
  - Main lifecycle panel và Job summary ở cột chính.
  - Partner, Chat và Financial summary ở sidebar.
  - Không chồng card, không horizontal overflow, không cắt modal/lightbox.
- Mobile ở 320×800, 375×800 và 768×1024:
  - Nội dung xếp một cột theo thứ tự Header → Stepper → Lifecycle → Job summary → sidebar.
  - Primary action/sticky action không che nội dung cuối trang hoặc bàn phím ảo.
  - Chat drawer khóa body scroll và vẫn tự scroll message list đúng.
- Đổi kích thước qua breakpoint khi modal, lightbox và Chat đang mở; nội dung phải còn dùng được,
  không mất state form và không tạo request mới.

## 3. IN_PROGRESS — Handyman Evidence và progressive Finish work

### 3.1 During Evidence

- Handyman thấy Contract readonly và khu vực `Work in progress photos`.
- Chọn đồng thời nhiều JPEG/PNG. Expected từng file upload tuần tự qua:
  `Selected/Uploading` → `Processing on server` → canonical evidence card.
- Trong lúc một file đang upload, input không khởi chạy batch thứ hai.
- Sau mỗi file thành công, Network có refetch evidence và `accepted-details`; counter `n/5 new`
  khớp số evidence chưa khóa, không khớp tổng lịch sử.
- Click ảnh mở lightbox đúng media; dùng keyboard đóng lightbox và focus quay lại control hợp lý.
- Click delete trên evidence mới:
  - Lần đầu chỉ mở inline confirm `Delete/Keep`.
  - `Keep` không gọi API.
  - `Delete` chỉ gọi API một lần, rồi evidence và canonical readiness được refetch.
- Khi backend không trả `UPLOAD_DURING_EVIDENCE` hoặc `DELETE_DURING_EVIDENCE`, frontend không
  được cấp action tương ứng dù state cũ còn trong browser.

### 3.2 Finish work và After Evidence

- Trước khi có After Evidence/request, nút `Finish work` chỉ mở khu vực
  `Completed work photos`; Network không có mutation đổi Job status.
- Refresh ngay sau khi chỉ click `Finish work`: frontend được phép thu gọn lại vì đây là local
  progressive disclosure, không phải backend substate.
- Upload ít nhất một After Evidence. Refresh page.
- Expected: After section tự mở lại vì canonical evidence đã tồn tại.
- Nếu đã từng có Completion Request, After section vẫn mở sau refresh kể cả attempt hiện tại chưa
  có ảnh mới.
- Kiểm tra upload, preview, retry, delete và counter cho After giống During; action phải theo
  `UPLOAD_AFTER_EVIDENCE`/`DELETE_AFTER_EVIDENCE`.

### 3.3 Validation, lỗi mạng và giới hạn theo attempt

- Chọn WebP hoặc file lớn hơn 5 MB. Expected: lỗi thân thiện tại client; không gọi upload API.
- Chọn batch làm tổng evidence chưa khóa vượt 5. Expected: chỉ số file còn chỗ được xếp hàng hoặc
  batch bị giới hạn rõ ràng; không vượt quá 5 record mới trên server.
- Khi đủ 5 evidence chưa khóa, label là `Photo limit reached for this attempt` và input disabled.
- Ngắt mạng/throttle request giữa upload:
  - Card chuyển `Upload failed`, giữ preview và lỗi.
  - `Retry` gửi lại đúng một file; `Remove` chỉ xóa local failed item.
  - Retry thành công không tạo hai evidence cho cùng lần retry UI.
- Tạo Completion Request để khóa snapshot, sau đó reject theo phần 5. Evidence cũ phải có badge
  `Locked`, không có delete và không tính vào counter `n/5 new` của attempt kế tiếp.
- Ở attempt kế tiếp có thể upload tối đa 5 ảnh mới dù gallery còn evidence locked từ attempt cũ.

## 4. Completion Request — Handyman submit và history

- Không có During hoặc After Evidence: checklist hiển thị blocking reason dễ hiểu; nút
  `Request completion` disabled và không gọi API khi thao tác keyboard.
- Có ít nhất một During và một After Evidence mới: `accepted-details` phải trả
  `REQUEST_COMPLETION`; UI hiển thị `Ready to request completion`.
- Mở modal request:
  - Focus nằm trong modal; Tab/Shift+Tab không thoát modal.
  - Escape hoặc Cancel đóng modal và restore focus.
  - Note optional, tối đa 2.000 ký tự; counter chính xác.
- Submit một lần rồi double click nhanh. Expected chỉ một Completion Request `PENDING`; nút chuyển
  trạng thái submitting/disabled và không có duplicate.
- Sau canonical refetch:
  - Handyman thấy `Waiting for customer confirmation`.
  - During/After evidence đều readonly và snapshot item có `Locked`.
  - Không còn upload/delete/request action.
- Mở `Completion request history`:
  - Item mới nhất đứng trước, sequence/status/note/timestamps đúng.
  - Evidence chỉ lazy-load khi Handyman mở item; mở lại không tạo request dư không cần thiết.
  - Ảnh snapshot mở được trong lightbox và luôn readonly.

## 5. Completion Request — Customer privacy, reject/retry và confirm

### 5.1 Privacy Network assertion

- Clear Network log rồi Customer mở/refresh `IN_PROGRESS` khi request `PENDING`.
- Expected UI chỉ có Contract, request sequence/status/time/note, privacy copy và Confirm/Reject.
- Tuyệt đối không có Completion Evidence gallery hoặc thumbnail.
- Filter Network bằng `evidence`. Customer không được gọi:

```text
GET /matchmaking/jobs/<jobId>/evidence/during
GET /matchmaking/jobs/<jobId>/evidence/after
GET /matchmaking/jobs/<jobId>/completion-requests/<requestId>/evidence
```

- Mở/đóng completion history nhiều lần vẫn không được phát sinh các request evidence trên.

### 5.2 Reject và retry

- Mở `Reject completion`; kiểm tra đủ reason enum, note tối đa 500 ký tự.
- Chưa chọn reason: submit disabled. Chọn `OTHER` nhưng note trống: submit vẫn disabled.
- Chọn reason khác với note optional, submit một lần. Expected request thành `REJECTED`, Customer về
  waiting state và Handyman được cập nhật bằng realtime/refetch.
- Handyman thấy rejection reason/note trong history; evidence cũ vẫn locked.
- Chưa upload evidence mới, canonical readiness có `NEW_COMPLETION_EVIDENCE_REQUIRED` và không cho
  request lại.
- Upload ít nhất một ảnh mới ở During hoặc After theo allowed action, rồi submit request tiếp theo.
- Expected sequence tăng, snapshot history cũ không đổi và request mới chứa snapshot tích lũy.

### 5.3 Confirm completion

- Với request `PENDING`, mở modal `Confirm completion`.
- Expected modal chỉ có nội dung xác nhận và hai action `Go back` / `Confirm completion`.
- Modal và Financial summary tuyệt đối không hiển thị total escrow, tỷ lệ 70/15/15, platform fee,
  Handyman payout hoặc warranty reserve.
- Confirm và double click nhanh. Expected một mutation, Job chuyển `WARRANTY`, Warranty `ACTIVE`.
- Customer và Handyman chuyển sang Warranty workspace sau refetch, không cần reload/redirect.

## 6. Payment summary và privacy

- `IN_PROGRESS`, `WARRANTY` và `CLOSED` chỉ hiển thị agreed service price, trạng thái bảo vệ/thanh toán
  và các timestamp phù hợp.
- Không role nào thấy total escrow, tỷ lệ chia nội bộ, platform fee, payout hay warranty reserve.
- Không lộ transaction ID, wallet balance hoặc account nội bộ.

## 7. WARRANTY ACTIVE và countdown

- Cả hai role thấy Started, Ends, warranty days, `ACTIVE` và Financial summary canonical.
- Countdown dựa trên `ends_at`; đổi timezone hệ điều hành vẫn đếm tới cùng instant.
- Khi countdown về 0 nhưng scheduler chưa đóng Job, UI vẫn giữ canonical `WARRANTY/ACTIVE`; không tự
  chuyển Completed, không tự release reserve.
- Handyman chỉ thấy trạng thái warranty đang diễn ra, không có Claim form/action.
- Customer thấy Claim Evidence manager và `Submit warranty claim`.
- Khi `now >= ends_at`, refetch phải loại action tạo claim theo backend; client không được duy trì
  action từ response cũ.

## 8. Warranty Claim — draft, submit và privacy

- Customer upload Claim Evidence; áp dụng cùng JPEG/PNG, 5 MB, sequential upload, retry/delete và
  tối đa 5 evidence chưa khóa.
- Không có Claim Evidence: canonical action `CREATE_WARRANTY_CLAIM` chưa xuất hiện hoặc submit button
  disabled; không gửi claim rỗng.
- Mở modal `Submit warranty claim`:
  - Reason bắt buộc.
  - Description tối đa 2.000 ký tự.
  - `OTHER` bắt buộc description không chỉ có whitespace.
  - Modal focus trap, Escape/Cancel và submitting state hoạt động như Completion modal.
- Submit và double click. Expected một Claim `PENDING_REVIEW`, Warranty `CLAIM_PENDING`, evidence bị
  snapshot/khóa và event `JOB_WARRANTY_CLAIM_CREATED` cho browser còn lại.
- Cả Customer và Handyman mở `Warranty claim history`; submitted Claim Evidence lazy-load và hiển thị
  cho đúng hai participant.
- Trước khi Customer submit draft, clear Network ở Handyman và refresh. Handyman không được gọi draft
  endpoint hoặc thấy thumbnail/metadata của Claim Evidence chưa submit.
- Claim snapshot sau submit phải bất biến; không còn upload/delete draft action.

## 9. CLAIM_PENDING và Admin raw SQL refresh

- Ở `CLAIM_PENDING`, cả hai role thấy Claim history và notice `Waiting for the claim review`.
- Không có action approve/reject/Admin UI, không có `CONTACT_SUPPORT`, không polling nền.
- Để Network idle ít nhất 60 giây. Expected không có chuỗi request `accepted-details` lặp theo timer.
- Chạy SQL development ở phần 11 của backend guide để approve Claim thành rework.
- SQL phải đổi đồng thời Claim thành `APPROVED_REWORK_REQUIRED` và Warranty thành `REWORK_REQUIRED`.
  Chỉ đổi Claim là state không nhất quán: UI sẽ cảnh báo và backend không cấp action cho Handyman.
- Không thao tác browser ngay sau SQL. Expected UI chưa tự đổi vì raw SQL không emit realtime.
- Click `Refresh`. Expected canonical refetch chuyển sang `REWORK_REQUIRED` ở cả role.
- Lặp lại với một Claim khác và dùng tab switch/Window focus thay cho nút Refresh. Expected refetch
  khi visibility/focus trở lại và UI đổi theo canonical response.
- Nếu chọn SQL reject Claim/reopen automatic expiry, refetch phải trở về state backend quy định;
  frontend không giữ `CLAIM_PENDING` theo local state.

## 10. REWORK_REQUIRED — Claim visibility và Warranty Evidence

- Customer thấy submitted Claim metadata/evidence và notice chờ Handyman; không thấy Warranty Rework
  uploader hoặc request action.
- Handyman thấy cùng submitted Claim snapshot và action `Start warranty rework`.
- Click `Start warranty rework`. Expected mở workspace `Warranty rework in progress`; đây là progressive
  disclosure local, canonical Warranty vẫn là `REWORK_REQUIRED`.
- Sau khi đã có Warranty Evidence hoặc request cũ, refresh phải tự mở lại workspace rework.
- Handyman upload/delete/retry Warranty Evidence theo cùng quy tắc file và counter `n/5 new`.
- Không có Warranty Evidence: `Request warranty completion` disabled theo canonical allowed action.
- Có evidence hợp lệ: mở request modal, note optional tối đa 2.000 và submit một lần.
- Expected Warranty `REWORK_CONFIRMATION_PENDING`, evidence snapshot locked, Handyman chuyển sang waiting
  và request xuất hiện đầu `Warranty completion history`.
- Handyman mở history item để lazy-load Warranty Rework Evidence; evidence readonly.

## 11. REWORK_CONFIRMATION_PENDING — Customer privacy và quyết định

- Clear Customer Network log rồi refresh.
- Expected Customer chỉ thấy request time/note, Claim history/evidence, privacy copy và
  `Confirm rework`/`Reject rework`.
- Customer tuyệt đối không thấy Warranty Rework Evidence và không gọi:

```text
GET /matchmaking/jobs/<jobId>/evidence/warranty
GET /matchmaking/jobs/<jobId>/warranty/completion-requests/<requestId>/evidence
```

- Mở Warranty completion history không được phát sinh hai request riêng tư trên.
- Reject rework:
  - Dùng cùng completion reason enum; note tối đa 500, bắt buộc khi `OTHER`.
  - Expected request `REJECTED`, Warranty và Claim sang `REVIEW_REQUIRED`, reserve vẫn held.
  - Không có retry action cho Handyman cho tới khi Admin SQL quyết định cycle mới.
- Ở `REVIEW_REQUIRED`, xác nhận notice + Refresh, không polling/Admin/support action.
- Dùng backend SQL development mở rework cycle mới. UI chỉ đổi sau Refresh/focus và canonical status
  trở lại `REWORK_REQUIRED`.
- Trên dữ liệu khác, Confirm rework. Expected request confirmed, Warranty trở lại canonical state do
  backend trả; reserve chưa được frontend tự release và Chat vẫn theo canonical Job status.

## 12. Normal warranty expiry và CLOSED

- Dùng development override ngắn hoặc dữ liệu có `ends_at` gần hiện tại, không có active Claim.
- Mở đồng thời hai browser khi scheduler chạy.
- Expected sau event/refetch:
  - Job `CLOSED`, stepper ở `Completed`.
  - Completed summary có Warranty started/released time và trạng thái payment complete.
  - Payment summary không hiển thị cách chia settlement nội bộ.
  - Không còn lifecycle mutation action.
- Nếu event bị bỏ lỡ, refresh/focus/reconnect vẫn đưa UI tới `CLOSED` từ canonical state.
- Completion, Claim và Warranty completion history vẫn đọc được:
  - Customer không thấy Completion/Rework Evidence riêng tư.
  - Handyman lazy-load được snapshot Completion/Rework Evidence.
  - Cả hai role thấy submitted Claim Evidence.

## 13. CLOSED Chat history-only

- Mở Chat ở `CLOSED`. Expected header hiển thị `History only`, message history và pagination cũ.
- Không có composer, send, retry-send, join room hoặc read-receipt action.
- Clear Network/Socket log rồi đóng/mở Chat:
  - Dùng GET conversation/history.
  - Không gọi POST create conversation.
  - Không emit socket `conversation:join`, `message:send` hoặc `message:read`.
- Load older messages nhiều lần; không duplicate, không đổi thứ tự và giữ scroll ổn định.
- Nếu backend REST không trả `closed_at`, UI không dựng timestamp giả.
- Mở Job khi Chat đang ACTIVE rồi để scheduler đóng Job:
  - Event/refetch không xóa message history đang có.
  - Composer biến mất, access chuyển HISTORY-only và conversation ID giữ nguyên.
- Refresh trực tiếp CLOSED page rồi mở Chat; history phải còn đọc được mà không cần một socket Chat
  connection mới.

## 14. Realtime với hai session và canonical refetch

Thực hiện lần lượt với hai browser cùng mở đúng Job:

```text
JOB_COMPLETION_REQUESTED
JOB_COMPLETION_REJECTED
JOB_COMPLETION_CONFIRMED
JOB_WARRANTY_STARTED
JOB_WARRANTY_CLAIM_CREATED
JOB_WARRANTY_COMPLETION_REQUESTED
JOB_WARRANTY_REWORK_CONFIRMED
JOB_WARRANTY_REWORK_REJECTED
JOB_WARRANTY_RELEASED
JOB_COMPLETED
```

- Participant không mutation nhận tối đa một toast có ý nghĩa và một refetch đã coalesce cho cặp
  event liên quan.
- Socket payload không trực tiếp thay đổi stage; sau mỗi event phải có `accepted-details` và UI khớp
  response đó.
- Event của Job khác, stale cycle hoặc event trùng không làm đổi UI/toast lặp.
- Ngắt Socket của một browser, thực hiện mutation ở browser kia rồi reconnect. Expected silent
  canonical refetch khôi phục state đúng.
- Chuyển tab ra/vào hoặc window blur/focus sau khi bỏ lỡ transition. Expected một refetch hợp lý,
  không tạo vòng lặp request.
- `JOB_WARRANTY_REWORK_REQUIRED` không được giả định sẽ đến từ raw SQL; dùng Refresh/focus cho flow đó.

## 15. Stale action, concurrency và failure recovery

- Mở cùng modal action ở hai tab cùng role; tab A submit trước, tab B submit sau.
- Expected tab B nhận stale/conflict message thân thiện, đóng hoặc vô hiệu action cũ và refetch
  canonical state; không duplicate request/settlement/claim.
- Thử Confirm và Reject cùng Completion Request từ hai Customer tabs. Chỉ một quyết định thắng; cả
  hai UI hội tụ cùng canonical state.
- Thử upload/delete khi backend vừa khóa evidence. Expected lỗi không làm mất evidence; refetch hiển
  thị badge `Locked` và bỏ delete action.
- Trả 401/403/404/409/500 giả lập từ DevTools/proxy:
  - Không hiển thị stack trace hoặc raw internals.
  - Không giữ optimistic success sai.
  - Retry chỉ lặp thao tác an toàn; mutation không tự retry vô hạn.
- Offline khi mutation đang gửi: button không mắc kẹt ở submitting sau khi request kết thúc lỗi; form
  data cần thiết vẫn còn để người dùng thử lại.
- Refresh giữa upload batch: không có object URL lỗi kéo dài, console không có unhandled rejection.

## 16. Accessibility và quality checklist

- Dùng chỉ keyboard đi qua uploader, evidence cards, history accordion, actions, modal, lightbox và
  Chat drawer. Thứ tự focus theo visual order.
- Mọi modal trap focus, Escape đóng khi không submitting và restore focus về trigger.
- Evidence image có accessible name; icon-only delete/close có `aria-label`; decorative icon ẩn với
  screen reader.
- Dynamic upload/error/waiting state có text, không chỉ phân biệt bằng màu.
- History accordion có thể mở/đóng bằng Enter/Space và công bố expanded state.
- Kiểm tra zoom 200%, Windows High Contrast và `prefers-reduced-motion`; không mất action/content.
- Kiểm tra contrast cho badge Locked, warning/error/success notice, disabled button và focus ring.
- Nội dung UI mới phải là tiếng Anh; không có placeholder nội bộ, raw enum chưa format hoặc copy
  `CONTACT_SUPPORT`/Review action không được backend hỗ trợ.
- Console không có React key warning, state update after unmount, failed prop access hoặc uncaught
  promise trong toàn bộ flow.

## 17. Regression và kết quả cần lưu

- Chạy lại smoke test ARRIVED → QUOTE → PAYMENT trong
  `docs/manual-frontend-arrived-to-in-progress-test.md`, đặc biệt BEFORE Evidence wrapper và Chat ACTIVE.
- Kiểm tra Customer/Handyman Job list và legacy detail link của `WARRANTY`/`CLOSED` đều điều hướng vào
  lifecycle workspace.
- Lưu ảnh desktop/mobile cho `IN_PROGRESS`, mỗi Warranty substate và `CLOSED`.
- Lưu Network HAR riêng cho hai privacy assertions của Customer và CLOSED Chat history-only.
- Ghi Job ID, role, browser, viewport, backend commit, frontend commit và timestamp cho mỗi failure.

Regression commands:

```bash
npm run lint
npm run build
git diff --check
```

Acceptance đạt khi toàn bộ UI hội tụ theo canonical response, không có private evidence request từ
Customer, evidence locked không thể sửa/xóa, không lộ settlement split nội bộ, raw SQL chỉ được nhận
qua manual refetch/focus, và CLOSED Chat chỉ còn REST history readonly.
