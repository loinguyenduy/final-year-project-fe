# SUPERSEDED

> Tài liệu này được giữ để đối chiếu regression. Manual hiện hành là `manual-frontend-posted-to-quote-pending-test.md`.

# Hướng dẫn kiểm thử frontend Job flow từ POSTED đến ARRIVED

Tài liệu này kiểm thử trực tiếp trên trình duyệt, không thay thế bằng Postman. Phạm vi gồm:

```text
POSTED → BIDDING → ACCEPTED → EN_ROUTE → ARRIVED
```

Kèm theo Chat, GPS, Arrival Request, cancellation, realtime, routing, privacy, responsive và accessibility.

## A. Chuẩn bị

### Môi trường

- Backend chạy đúng cấu hình development.
- Frontend chạy tại `http://localhost:5173` hoặc port Vite thực tế.
- Socket.IO kết nối được qua `VITE_SOCKET_URL` hoặc origin của API.
- Có Chrome DevTools, tab Network, Application, Console và Sensors.
- Chuẩn bị:
  - một Customer đã KYC;
  - một Handyman đủ level;
  - một tài khoản outsider;
  - hai browser profile hoặc một cửa sổ thường và một cửa sổ Incognito.
- Chuẩn bị Job ở các trạng thái:
  - `POSTED`;
  - `BIDDING` có ít nhất hai Bid;
  - `ACCEPTED`;
  - `EN_ROUTE` không có request;
  - `EN_ROUTE` có request pending;
  - `ARRIVED`;
  - `CANCELLATION_REVIEW`.

### Kiểm tra dữ liệu nền

- Job ACCEPTED có selected Bid `WON`.
- Deposit của Job là `HELD`.
- Acceptance cycle hiện tại hợp lệ.
- Customer và selected Handyman đều active.
- Có cả:
  - Job có `gps_lat/gps_long`;
  - Job không có tọa độ.

### Cloudinary/Evidence audit

- Backend đã có:
  - `POST /api/v1/matchmaking/jobs/:jobId/evidence/before`;
  - `GET /api/v1/matchmaking/jobs/:jobId/evidence/before`;
  - `DELETE /api/v1/matchmaking/jobs/:jobId/evidence/before/:evidenceId`.
- Frontend task này chưa triển khai Evidence uploader.
- Không kỳ vọng request Cloudinary/Evidence nào trong `ACCEPTED` hoặc `EN_ROUTE`.
- Tại `ARRIVED`, frontend chỉ hiển thị next-step summary và không render raw action như `UPLOAD_BEFORE_EVIDENCE`.

## B. POSTED

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| B1 Direct open | Customer, Job POSTED | Mở `/customer/my-jobs/:id` | Job header, status Posted, shared progress stepper, Job details và action cũ hiển thị bình thường | Generic Job Details trả `EC=0` | Không yêu cầu lifecycle event | Giữ legacy detail URL | Redirect nhầm sang lifecycle |
| B2 Refresh | Như B1 | Refresh trình duyệt | Không phụ thuộc navigation state; stepper vẫn ở Posted | Một request Job Details mới | N/A | URL không đổi | Mất Job ID hoặc blank page |
| B3 Mobile | Như B1, viewport 320/360/390 | Mở trang và cuộn | Stepper pre-acceptance dùng compact summary, không horizontal scroll | Không có request thừa | N/A | URL không đổi | Stepper 8 bước tràn ngang |
| B4 Transition | Job có action mở Bidding | Thực hiện action hiện có | Status chuyển Bidding, Bid area sẵn sàng | Endpoint transition cũ thành công | Nếu backend có event cũ thì không ảnh hưởng lifecycle socket | Vẫn legacy details | Workspace lifecycle mở quá sớm |

## C. BIDDING

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| C1 Bid list | Customer, Job BIDDING có Bid | Mở details | Danh sách Bid, số Bid, giá, Handyman và shared stepper Bidding | Generic details chứa Bids | N/A | Legacy URL | Bid list mất sau thay stepper |
| C2 Compare | Có ít nhất hai Bid | Chọn Bid và mở Compare | Compare modal vẫn hoạt động | API profile/compare cũ hoạt động | N/A | Không đổi route | Shared component CSS làm vỡ modal |
| C3 Accept | Customer đủ số dư | Hire Handyman và thanh toán cọc | Thành công, selected Handyman rõ ràng | Accept/deposit APIs thành công; Job thành ACCEPTED | Có thể nhận event theo backend hiện có | Redirect `/jobs/:jobId/lifecycle` | Ở lại page cũ hoặc redirect loop |
| C4 Browser back | Sau C3 | Nhấn Back | Không quay lại một màn Bidding stale có thể thao tác | Nếu legacy page load lại, nó nhận ACCEPTED | Lifecycle event không nhân đôi | Cuối cùng quay lại lifecycle hoặc list hợp lệ | Cho phép accept Bid lần hai |
| C5 Handyman list | Handyman có Bid | Mở `/handyman/my-jobs` | Page title My Jobs; Bid và active Job cùng danh sách | Backend vẫn gọi `/matchmaking/handyman/my-bids` | N/A | Canonical `/handyman/my-jobs` | UI vẫn ghi My Bids |
| C6 Legacy My Bids URL | Handyman | Mở `/handyman/my-bids` | Không flash page lỗi | Không thêm API đặc biệt | N/A | Redirect replace `/handyman/my-jobs` | Hai canonical URL hoặc Back loop |

## D. ACCEPTED — Customer

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| D1 Direct lifecycle | Customer owner, ACCEPTED | Mở `/jobs/:jobId/lifecycle` | Customer layout, Accepted step, “The handyman has accepted your job”, partner, deposit, Chat | `GET accepted-details` | Lifecycle socket dùng authenticated shared connection | Giữ lifecycle URL | Role layout sai |
| D2 Refresh | Như D1 | Refresh | Không mất Chat launcher, partner hay allowed action | Canonical details fetch | Socket reconnect/refetch nếu cần | URL không đổi | Phụ thuộc `location.state` |
| D3 Reopen | Backend trả `REOPEN_BIDDING` | Chọn Find another handyman, submit reason | Modal English, request thành công | `POST cancel-by-customer` với `action=REOPEN_BIDDING` | Không emit lifecycle event ngoài contract | Redirect legacy Bidding details | Cancellation action cạnh tranh primary |
| D4 Cancel | Backend trả `CANCEL_JOB` | Mở text link cancellation, submit | Link nằm dưới stage; Job cancel thành công | `POST cancel-by-customer` | Chat close theo backend Accepted cancellation | Redirect legacy Cancelled details | Nút đỏ lớn ngang primary |
| D5 Partner/Chat | Như D1 | Mở Chat, nhập draft nhưng chưa gửi | Drawer mở; draft giữ nguyên khi details silent-refetch | Chat discovery/history APIs | Chat và lifecycle dùng cùng Socket.IO connection | Không đổi route | Hai websocket connection cùng token |
| D6 Privacy | Customer | Kiểm tra UI/DOM/Network rendering | Không hiển thị raw Handyman en-route GPS | accepted-details có thể chứa Job location nhưng UI không render raw Handyman GPS | Event không chứa GPS | N/A | Render `gps_lat/gps_long` |

## E. ACCEPTED — Handyman và Start Moving

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| E1 Ready state | Selected Handyman, ACCEPTED | Mở lifecycle | Handyman accent cam, primary Start moving, cancellation là text link | `GET accepted-details` | Shared socket connected | Giữ lifecycle URL | Toàn page thành theme cam nặng |
| E2 GPS success | Job có tọa độ | Start moving, Allow location | Button loading; Job chuyển En route | `POST start-moving` có lat/long/accuracy | Customer nhận `JOB_EN_ROUTE` | Route không đổi | Full reload hoặc mất Chat |
| E3 Permission denied | Job có tọa độ | Deny location | Modal giữ mở, English error, Retry; không có fallback không GPS | Không POST hoặc POST không được gọi | Không event | Route không đổi | Silent fallback `{}` |
| E4 Timeout | Job có tọa độ | Mock timeout | Hiện timeout message và Retry | Không POST | Không event | Không đổi | Modal tự đóng |
| E5 Position unavailable | Job có tọa độ | Mock unavailable | Hiện device/location error | Không POST | Không event | Không đổi | Raw browser error/code |
| E6 Job no coordinates | ACCEPTED không tọa độ, GPS lỗi | Chọn Continue without location | Hành động được phép có chủ đích | `POST start-moving` body `{}` | `JOB_EN_ROUTE` | Route không đổi | Fallback xuất hiện trước khi GPS lỗi |
| E7 Double click | GPS success | Click primary nhanh hai lần | Chỉ một mutation in-flight | Tối đa một app-layer POST; backend idempotent nếu retry transport | Một canonical event | Không đổi | Hai history/event |
| E8 Idempotent retry | Job đã EN_ROUTE nhưng response trước bị mất | Gửi lại theo tình huống test | Toast nói journey đã bắt đầu và refetch | `EN_ROUTE_ALREADY_STARTED` | Không duplicate emit | Giữ lifecycle | Hiện lỗi đỏ |

## F. EN_ROUTE

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| F1 Customer view | Customer, EN_ROUTE | Mở lifecycle | Started time, estimated distance, ETA; ghi rõ không phải live tracking | `GET accepted-details` | Socket active | Lifecycle URL | Gọi dữ liệu snapshot là live tracking |
| F2 Handyman view | Selected Handyman | Mở cùng Job | Metrics tương tự, có accuracy nếu backend trả | Canonical fetch | Socket active | Lifecycle URL | Customer cũng thấy raw GPS |
| F3 Distance meters | Snapshot dưới 1 km | Kiểm tra metric | Hiển thị `m`, không NaN/null | N/A | N/A | N/A | `null km` |
| F4 Distance km | Snapshot trên 1 km | Kiểm tra metric | Hiển thị km tối đa 2 số thập phân | N/A | N/A | N/A | Sai đơn vị |
| F5 Null snapshot | Job không tọa độ | Mở lifecycle | “Not available” và notice Job vẫn tiếp tục | Canonical fetch trả null | N/A | Không đổi | `undefined`, `NaN min` |
| F6 Chat preservation | Hai browser | Gõ draft, bên kia tạo arrival request | Draft không mất khi canonical refetch | Chat APIs không reset | Lifecycle event không remount Chat | Không đổi | Chat drawer đóng |
| F7 Cancellation link | Backend trả `REQUEST_CANCELLATION` | Mở link | Text link dưới primary; modal có policy preview | Chưa POST trước confirm | Không event | Không đổi | Cancellation thành main card |

## G. Arrival Request

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| G1 GPS success | Handyman EN_ROUTE, `REQUEST_ARRIVAL` | I have arrived, Allow GPS | Fresh GPS loading, request thành công | `POST arrival-requests` có lat/long/accuracy | Customer nhận `JOB_ARRIVAL_REQUESTED` | Route không đổi | Dùng lại GPS Start Moving |
| G2 FAR warning | GPS cách Job >500m | Gửi request | Request không bị chặn; warning nhẹ | Response location warning FAR | Customer refetch | Không đổi | Frontend chặn submit |
| G3 No location allowed | Job không tọa độ, GPS lỗi | Continue without location | Request vẫn tạo | POST `{}` | Customer nhận event | Không đổi | Không có fallback |
| G4 Duplicate pending | Request đang PENDING | Retry request | Toast nói request đã tồn tại | `ARRIVAL_REQUEST_EXISTS` | Không duplicate event | Không đổi | Hiện lỗi lifecycle |
| G5 Customer event | Customer đang mở Job | Handyman gửi request | Toast + silent canonical refetch; không tự mở modal | Customer GET accepted-details | `JOB_ARRIVAL_REQUESTED` | Không đổi | Modal tự bật |
| G6 Other Job event | Customer mở Job A | Phát event Job B | UI Job A không đổi | Không refetch vì event bị lọc | Event bị bỏ qua | Không đổi | Toast sai Job |

## H. Reject Arrival

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| H1 Not present | Customer có pending request | Chọn handyman not present | Modal English; Job vẫn En route | POST reject reason `HANDYMAN_NOT_PRESENT` | Handyman nhận `JOB_ARRIVAL_REJECTED` | Không đổi | Chuyển Cancelled/Bidding |
| H2 Wrong location | Như H1 | Chọn wrong location | Success toast, post-rejection state | Reason `WRONG_LOCATION` | Event đúng cycle | Không đổi | Ghi đè Job address |
| H3 Too early | Như H1 | Chọn sent too early | Success | Reason `ARRIVAL_REQUEST_SENT_TOO_EARLY` | Event | Không đổi | Reason sai contract |
| H4 OTHER validation | Như H1 | Chọn Another reason, để note rỗng | Không submit, focus/form error rõ | Không POST | Không event | Không đổi | Gửi note rỗng |
| H5 OTHER max | Như H1 | Nhập 500 ký tự | Submit được | POST note tối đa 500 | Event | Không đổi | Counter sai |
| H6 Double submit | Như H1 | Click confirm nhanh | Một mutation | Một request app-layer; retry backend idempotent | Một event | Không đổi | Count tăng hai lần |
| H7 Cooldown | Handyman sau reject | Mở lifecycle | Reason, note, rejection count, countdown | canonical details có retry seconds | Không cần event mới | Không đổi | Gửi lại trước cooldown |
| H8 Refresh cooldown | Countdown đang chạy | Refresh | Countdown dựng lại từ backend, không reset giả | GET accepted-details | Reconnect refetch | Không đổi | Countdown bắt đầu lại 60 giây sai |
| H9 Resend | Cooldown hết | Chờ auto-refetch | Primary I have arrived xuất hiện; không tự gửi | Silent GET | Không event | Không đổi | Tự động POST |
| H10 Three rejects | Cycle đạt limit | Refresh Handyman | Arrival review required, không có request action | GET policy `review_required=true` | Event reject lần ba | Không đổi | Vẫn cho request thứ tư |
| H11 Customer post-rejection | Customer sau reject | Đóng modal/refresh | Notice nói request trước không được xác nhận; Job vẫn En route | Canonical GET | N/A | Không đổi | Customer không biết kết quả vừa xử lý |

## I. Confirm Arrival

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| I1 Confirm | Customer có pending request | Confirm arrival | Job chuyển Arrived, stepper hoàn thành | POST confirm rồi canonical GET | `JOB_ARRIVED` tới hai bên | Route không đổi | Full reload |
| I2 Double click | Như I1 | Click nhanh | Button loading, một mutation | Một app-layer request | Một event | Không đổi | Hai history |
| I3 Idempotent | Request đã confirmed | Retry theo test mất response | Friendly already confirmed message | `ARRIVAL_ALREADY_CONFIRMED` | Không emit lại | Không đổi | Error toast |
| I4 Stale request | Request đã xử lý ở browser khác | Confirm request cũ | Modal đóng, stale message, canonical refetch | 409 request not pending/not found | Event từ browser thắng | Không đổi | Modal stale vẫn mở |
| I5 Confirm/reject race | Hai Customer sessions | Confirm và reject đồng thời | Một action thắng; session thua refetch canonical | Backend serialize | Một final event | Không đổi | Hai trạng thái cùng hiện |
| I6 Chat draft | Handyman đang gõ draft | Customer confirm | Chat không remount, draft giữ nguyên | Không reset conversation API | `JOB_ARRIVED` chỉ refetch lifecycle | Không đổi | Draft mất |

## J. ARRIVED

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| J1 Customer | ARRIVED | Mở lifecycle | Arrived step completed, confirmed time, partner, finance, next-step summary | GET accepted-details | Socket active | Lifecycle URL | Render raw `WAIT_FOR_QUOTE` |
| J2 Handyman | ARRIVED | Mở lifecycle | Arrived summary; không render upload/quote action | GET details có thể chứa Evidence/Quote allowed actions | Không listener Quote task sau | Lifecycle URL | Raw action enum |
| J3 Refresh | Cả hai role | Refresh | State giữ đúng, Chat launcher hoạt động | Canonical fetch | Shared socket acquire | Không đổi | Redirect legacy |
| J4 Cancellation | Backend trả action | Mở text link | Exact preview theo role/reason/phase | Chỉ POST sau confirm | Event theo result | Có thể redirect nếu resolved | Cancellation nổi ngang stage primary |
| J5 Cloudinary absence | Handyman ARRIVED | Quan sát Network | Không có evidence upload/list tự động | Không request evidence | N/A | Không đổi | Upload tự chạy |

## K. Cancellation

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| K1 Accepted old flow | ACCEPTED | Customer/Handyman cancel | Lý do đúng endpoint cũ; note tối đa 1000 | cancel-by-customer/handyman | Chat lifecycle theo backend cũ | Bidding/Cancelled legacy | Gọi unified endpoint |
| K2 Auto resolve | EN_ROUTE/ARRIVED, auto reason | Xem preview và confirm | Preview exact; backend result final | POST cancellations | `JOB_CANCELLED` | Replace legacy details | Frontend gửi classification/amount |
| K3 Mutual | Reason Mutual Agreement | Submit | Workspace chuyển Cancellation review | POST cancellations | `JOB_CANCELLATION_REQUESTED` | Route giữ lifecycle | Tự cancel trước counterparty |
| K4 Counterparty confirm | Mutual pending | Confirm | Job Cancelled, Chat đóng | POST confirm | `JOB_CANCELLED` | Legacy details | Payout lặp |
| K5 Counterparty reject | Mutual pending | Decline + optional note | Review required, deposit held, Chat active | POST reject | `JOB_CANCELLATION_REJECTED` | Lifecycle giữ nguyên | Redirect Cancelled |
| K6 Review reason | Disputed/Other | Submit | Cancellation review; không payout | POST cancellations | `JOB_CANCELLATION_REVIEW_REQUIRED` | Lifecycle | Hiển thị classification enum |
| K7 Duplicate create | Request đã active | Retry cùng request | Existing request loaded | `CANCELLATION_ALREADY_EXISTS` | Không duplicate event | Lifecycle | Error đỏ |
| K8 Stale response | Browser khác xử lý trước | Confirm/reject cũ | Modal đóng, friendly conflict, canonical refetch | 409 conflict | Event từ action thắng | Theo canonical status | Modal cũ tiếp tục submit |
| K9 Preview parity | Mỗi role/phase/reason | So số tiền frontend với response backend | Tổng Customer + Handyman đúng deposit | Backend trả financial preview/result | N/A | N/A | Floating-point hoặc policy drift |

## L. Realtime và shared socket

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| L1 One connection | Lifecycle mở, Chat đã discover conversation | DevTools → Network → WS | Một authenticated Socket.IO connection cho cùng token | Một websocket transport | Chat và lifecycle listener cùng connection | N/A | Hai websocket song song |
| L2 Chat join | Mở Chat | Gửi message | Message optimistic/confirmed bình thường | Socket `JOIN_CONVERSATION`, send ack | Chat event không ảnh hưởng lifecycle | Không đổi | Lifecycle cleanup làm mất Chat listener |
| L3 Lifecycle event | Chat đang mở | Bên kia Start Moving | Toast + silent refetch; Chat vẫn hoạt động | GET accepted-details | `JOB_EN_ROUTE` | Không đổi | Shared socket listener bị removeAll |
| L4 Reconnect | Tắt/bật network | Quan sát | Connection state reconnecting rồi connected | Websocket reconnect; silent GET | Chat refresh history, lifecycle refetch | Không đổi | Duplicate toast/message |
| L5 Duplicate event | Phát cùng payload hai lần | Quan sát toast | Một toast cho cùng identity | Tối đa một coalesced refetch | Event deduped | Không đổi | Hai toast |
| L6 Stale cycle | Event cycle cũ | Phát event | Không toast/refetch | Không request mới | Event bị bỏ qua | Không đổi | State cycle cũ xuất hiện |
| L7 Tab switching | Hai tab cùng account | Chuyển focus qua lại | Không mất Chat draft hoặc tạo loop | Có thể silent discovery theo Chat logic | Socket ổn định | Không đổi | Nhiều listener tích lũy |

## M. Routing, privacy và lỗi

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| M1 Logged-out deep link | Chưa login | Mở lifecycle URL, login đúng role | Không mất Job URL | Login + accepted-details | Socket sau login | Quay lại lifecycle URL | Về dashboard |
| M2 Outsider | Authenticated outsider | Mở lifecycle Job khác | Friendly access error, không lộ data | 403/404 theo backend | Không subscribe meaningful Job data | Không redirect loop | Hiện participant/finance |
| M3 Legacy redirect | Customer/Handyman mở legacy detail của ACCEPTED/EN_ROUTE/ARRIVED | Mở URL | Không flash action cũ | Generic details rồi accepted-details | Socket lifecycle | Replace lifecycle URL | Loop hai route |
| M4 Non-lifecycle | CANCELLED/BIDDING | Mở legacy details | Legacy page render | Generic details | Không lifecycle socket | Giữ legacy | Redirect sai |
| M5 Internal errors | Mock wallet/escrow/invariant error | Submit cancellation | Friendly safe message, không raw code | Error envelope | Không event | Modal tùy loại lỗi | Hiện `CANCELLATION_PAYOUT_INCONSISTENT` |
| M6 Raw coordinates | Customer | Tìm text/DOM | Không có raw Handyman coordinates | Không log token/GPS | Events không chứa GPS | N/A | Raw GPS trong notice |
| M7 Unknown action | ARRIVED có action task sau | Mở lifecycle | Không render enum; chỉ next-step summary | Canonical details | Không listener future event | Không đổi | Nút tên `UPLOAD_BEFORE_EVIDENCE` |

## N. Responsive và accessibility

Kiểm tra các viewport:

- `320 × 800`
- `360 × 800`
- `390 × 844`
- `768 × 1024`
- `1024 × 768`
- `1366 × 768`
- `1440 × 900`

| Case | Preconditions / Browser | Steps | Expected UI | Expected network | Expected realtime | Expected navigation | Common failures |
|---|---|---|---|---|---|---|---|
| N1 Header | Mỗi viewport | Mở tất cả stage | Title không quá lớn, status wrap hợp lý | N/A | N/A | N/A | Header cao quá mức |
| N2 Stepper | Mỗi viewport | Kiểm tra Posted/Bidding và lifecycle | Connector theo tâm circle; label row riêng; lifecycle 3 bước không overflow | N/A | N/A | N/A | Line xuyên label |
| N3 Stage actions | Mobile | Cuộn tới primary action | Sticky trong stage, không che content/Chat | N/A | N/A | N/A | Fixed overlay che drawer |
| N4 Context rail | 320–1024 | Kiểm tra Partner/Financial | Một cột trên mobile, hai nhóm trong cùng surface | N/A | N/A | N/A | Card nesting hoặc overflow |
| N5 Job details | Mobile | Expand/collapse | Address và description wrap; ảnh không tràn | N/A | N/A | N/A | Horizontal scroll |
| N6 Modals | Mobile | Mở GPS, confirm, reject, cancellation | Bottom sheet/full width, footer usable | Mutation tương ứng | Event chỉ sau success | Route không đổi | Nút ngoài viewport |
| N7 Keyboard | Desktop | Tab qua page/modal | Focus visible, trap trong modal, Escape close khi không submitting | N/A | N/A | N/A | Focus thoát backdrop |
| N8 Focus restore | Desktop | Mở và đóng modal/Chat | Focus trở về launcher/action | N/A | N/A | N/A | Focus mất |
| N9 Forms | Reject/cancellation | Dùng keyboard/radio/textarea | Legend, label, counter và error đọc được | N/A | N/A | N/A | Chỉ dùng màu để báo lỗi |
| N10 Reduced motion | OS reduce motion | Mở loading/Chat | Animation bị giảm/tắt | N/A | N/A | N/A | Drawer/pulse chạy mạnh |
| N11 Touch targets | Mobile | Chạm primary, Message, Call, close | Target đủ lớn và không quá sát | N/A | N/A | N/A | Nút 30–34 px |

## O. Các chức năng cố ý để task frontend sau

Task hiện tại dừng ở browser flow `ARRIVED`. Những phần sau đã có backend nhưng chưa có frontend:

1. Handyman upload/list/delete ảnh BEFORE evidence.
2. Customer xem BEFORE evidence sau khi Quote được submit.
3. Quote Draft:
   - create;
   - update full replacement;
   - revision conflict;
   - totals/variance preview;
   - submit.
4. Customer xem, accept hoặc reject Quote.
5. Workspace cho `QUOTE_PENDING`.
6. Payment summary và remaining payment.
7. Workspace cho `PAYMENT_PENDING`.
8. Contract snapshot và Contract viewer.
9. Workspace cho `IN_PROGRESS`.
10. Realtime listeners:
    - `JOB_QUOTE_SUBMITTED`;
    - `JOB_QUOTE_ACCEPTED`;
    - `JOB_QUOTE_REJECTED`;
    - `JOB_PAYMENT_REQUIRED`;
    - `JOB_PAYMENT_COMPLETED`;
    - `JOB_IN_PROGRESS`.
11. Mở rộng shared stepper sau Arrived bằng Quote, Payment và In progress.

## P. Lệnh kiểm tra cuối

```bash
npm run build
npm run lint
git diff --check
```

Kết quả cần ghi riêng:

- lỗi mới do source task hiện tại;
- lỗi baseline từ `eslint.config.js`;
- cảnh báo bundle size;
- cảnh báo line ending nếu có.

Không sửa ESLint toàn dự án hoặc module ngoài Job flow chỉ để làm sạch báo cáo.
