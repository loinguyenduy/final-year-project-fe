# Hướng dẫn kiểm thử thủ công frontend chat ở giai đoạn ACCEPTED

Tài liệu này dùng để kiểm tra luồng chat được mở từ trang chi tiết job có trạng thái chính xác là `ACCEPTED`. Đây là kiểm thử development end-to-end giữa frontend, REST API, Socket.IO và PostgreSQL; không phải automated test framework.

## 1. Phạm vi và kết quả mong đợi

Frontend chỉ hiển thị nút **Message** trong `AcceptedJobView`. Khi trang vừa mở, frontend chỉ gọi `GET conversation` để dò conversation hiện tại; thao tác này không được tạo dữ liệu. `POST conversation` idempotent chỉ chạy khi người dùng bấm **Message**.

Chat phải đáp ứng các điểm chính:

- customer và selected handyman của acceptance cycle hiện tại mới được truy cập;
- desktop mở drawer bên phải và vẫn nhìn thấy trang job;
- mobile mở full-screen, header/composer luôn sử dụng được;
- message là plain text, có optimistic state, retry và deduplicate;
- unread/read/seen chỉ thay đổi khi đúng điều kiện visibility và scroll;
- participant inactive chỉ khóa tạm thời;
- lifecycle hoặc acceptance cycle không còn hợp lệ sẽ đóng conversation;
- socket reconnect phải join room và đồng bộ message bị bỏ lỡ.

## 2. Chuẩn bị dữ liệu kiểm thử

Nên tạo dữ liệu development riêng, không dùng job hoặc tài khoản quan trọng.

| Dữ liệu | Mục đích |
| --- | --- |
| Customer A | Chủ job và participant thứ nhất |
| Handyman B | Selected handyman và participant thứ hai |
| Outsider C | Không thuộc job, dùng kiểm tra chống lộ conversation |
| Job chính | Job `ACCEPTED`, có deposit/payment hợp lệ, selected bid của B, `acceptance_cycle >= 1` |
| Job lifecycle | Job `ACCEPTED` dùng riêng để cancel/reopen; có thể phát sinh refund |
| Token A/B/C | Access token còn hạn của ba tài khoản |

Ghi lại:

```text
CUSTOMER_ID=
HANDYMAN_ID=
OUTSIDER_ID=
JOB_ID=
LIFECYCLE_JOB_ID=
CUSTOMER_TOKEN=
HANDYMAN_TOKEN=
OUTSIDER_TOKEN=
```

Kiểm tra invariant của job chính trước khi test:

- `current_status = ACCEPTED`;
- `acceptance_cycle` lớn hơn `0`;
- `customer_id = CUSTOMER_ID`;
- selected bid thuộc Handyman B;
- `selected_bid_id`, `selected_handyman_id` và dữ liệu deposit/payment hợp lệ;
- cả Customer A và Handyman B có `is_active = true`.

## 3. Chạy backend, frontend và cấu hình URL/CORS

Mở hai terminal.

Backend:

```powershell
cd D:\Workspace\Final_Year_Project\final-year-project-be
npm run dev
```

Frontend:

```powershell
cd D:\Workspace\Final_Year_Project\final-year-project-fe
npm run dev
```

Mặc định frontend gọi REST tại `http://localhost:5000/api/v1`. Socket lấy origin từ REST URL, tức `http://localhost:5000`. Có thể đặt URL socket khác trong file env development của frontend:

```env
VITE_SOCKET_URL=http://localhost:5000
```

Backend cần cho phép đúng origin của Vite:

```env
FRONTEND_URL=http://localhost:5173
SOCKET_CORS_ORIGIN=http://localhost:5173
```

Nếu dùng nhiều origin, `SOCKET_CORS_ORIGIN` nhận danh sách phân cách bằng dấu phẩy. Sau khi sửa env phải restart backend/frontend. Không đưa dấu `/` ở cuối origin nếu origin thực tế không có dấu đó.

Chuẩn bị hai browser profile hoặc hai browser khác nhau:

- Chrome/Profile 1 đăng nhập Customer A;
- Edge/Profile 2 đăng nhập Handyman B;
- cửa sổ incognito hoặc Profile 3 đăng nhập Outsider C khi cần.

Không dùng hai tab cùng một profile cho hai tài khoản khác nhau vì Redux persisted state/cookie có thể ghi đè nhau.

## 4. Dò và tạo conversation đúng contract

Mở DevTools → **Network** → lọc `conversation`.

### CHAT-FE-01: GET không tạo conversation

1. Chọn một job `ACCEPTED` chưa từng mở chat.
2. Mở trang chi tiết job nhưng chưa bấm **Message**.
3. Xác nhận request `GET /api/v1/chat/jobs/:jobId/conversation` trả `404 CONVERSATION_NOT_FOUND`.
4. Xác nhận không có request `POST`.
5. Có thể đối chiếu DB: chưa có record `(job_id, acceptance_cycle)` trong `Conversations`.

Kết quả PASS: trang job hoạt động bình thường, nút Message hiển thị, GET không tạo dữ liệu.

### CHAT-FE-02: POST 201 và idempotent 200

1. Bấm **Message** lần đầu.
2. Xác nhận `POST /api/v1/chat/jobs/:jobId/conversation` trả HTTP `201`, `DT.created = true` và có conversation ID.
3. Đóng drawer, reload trang, bấm **Message** lại.
4. Xác nhận POST trả HTTP `200`, `DT.created = false` và cùng conversation ID.
5. Xác nhận DB chỉ có một conversation cho `(job_id, acceptance_cycle)`.

Lưu ý: GET có thể chạy lại khi tab focus/visible; đó là cơ chế refresh metadata, không phải polling.

### CHAT-FE-03: outsider

Outsider không có đường vào `AcceptedJobView` hợp lệ. Dùng Postman hoặc backend manual socket script với conversation ID để xác nhận REST history và socket join đều trả `404 CONVERSATION_NOT_FOUND`, không phải `403`.

## 5. Giao diện drawer và responsive

Trong Chrome DevTools bật Device Toolbar và kiểm tra lần lượt: `1440`, `1024`, `768`, `430`, `375` px.

| Kích thước | Kết quả mong đợi |
| --- | --- |
| 1440/1024 | Drawer bên phải khoảng 420px; phần còn lại của trang job vẫn thấy; không có backdrop chặn page |
| 768 trở xuống | Chat full-screen, không xuất hiện scroll ngang |
| 430/375 | Header không vỡ; tên dài ellipsis; message/composer không tràn; bàn phím mobile không che nút gửi |

Kiểm tra thêm:

- Customer dùng accent xanh, Handyman dùng accent cam.
- Nút Message và badge không che nút phone/copy.
- `Esc` đóng drawer; nút close có focus ban đầu; sau khi đóng, focus trở lại nút Message.
- Mobile khóa body scroll, desktop vẫn giữ page phía sau nhìn thấy.
- Header và composer giữ vị trí trong viewport; phần messages là vùng scroll riêng.
- Thiết bị có safe-area không che header/composer.

## 6. Realtime hai chiều và nhiều tab của sender

### CHAT-FE-04: Customer ↔ Handyman

1. Mở cùng job ở Customer A và Handyman B.
2. Mở drawer cả hai bên.
3. Customer gửi `Hello from customer`.
4. Customer thấy bubble optimistic `Sending…`, sau ack chuyển thành sent.
5. Handyman nhận message ngay, không reload.
6. Handyman trả lời; Customer nhận ngay.
7. Network → WS → Frames phải thấy `message:send`, ack và `message:new` phù hợp.

### CHAT-FE-05: tab thứ hai của sender

1. Trong profile Customer A mở cùng job ở Tab A1 và Tab A2.
2. Mở drawer cả hai tab; mở drawer Handyman B.
3. Gửi từ A1.
4. A1 nhận acknowledgement và chỉ có một bubble.
5. A2 nhận `message:new` và chỉ có một bubble.
6. Handyman nhận cùng message.

Không được có duplicate khi cùng message đi qua history, ack và realtime.

## 7. Optimistic send, timeout, duplicate retry và conflict

### CHAT-FE-06: optimistic success

Throttling mạng về Slow 3G, gửi một message. Bubble phải xuất hiện ngay trước ack, có `Sending…`, sau đó đổi thành sent. Composer chỉ xóa draft sau khi backend xác nhận thành công.

### CHAT-FE-07: mất kết nối hoặc ack timeout

1. Khi socket đang connected, nhập một nội dung dễ nhận biết.
2. Dùng Node inspector/VS Code đặt breakpoint backend ngay sau `sendMessageService` và trước lệnh `ack(...)` trong handler `message:send`. Đây là vị trí DB đã commit nhưng frontend chưa nhận ack.
3. Gửi message và giữ breakpoint quá 8 giây, hoặc ngắt backend/network tại điểm đó.
4. Frontend phải giữ nguyên draft và bubble failed; không tự retry liên tục.
5. Khôi phục backend/network, đợi socket connected, bấm **Retry**.
6. Retry phải dùng lại `client_message_id`; backend trả duplicate cũ và UI hợp nhất thành một bubble sent.

Nếu ngắt mạng trước khi DB commit, Retry sẽ tạo record lần đầu nhưng vẫn dùng cùng client ID; UI vẫn chỉ có một bubble.

### CHAT-FE-08: `CLIENT_MESSAGE_ID_CONFLICT`

Chỉ thực hiện trên DB development:

1. Tạo trạng thái timeout sau commit như CHAT-FE-07 và ghi lại `client_message_id` từ debugger/DB.
2. Trong DB đổi tạm `content` của record đó sang một nội dung khác.
3. Khôi phục socket rồi bấm Retry trên bubble cũ.
4. Backend trả `409 CLIENT_MESSAGE_ID_CONFLICT`.
5. Bubble hiển thị lỗi và nút **Send as new**, không tiếp tục retry cùng ID.
6. Bấm **Send as new**; request mới phải có UUID khác.
7. Khôi phục dữ liệu test nếu cần.

Không thử thao tác DB này trên production.

## 8. Validate nội dung message

Chạy từng case sau và đối chiếu UI, Socket frame, DB:

| Case | Input | Mong đợi |
| --- | --- | --- |
| Empty | rỗng hoặc chỉ space/newline | Nút send disabled hoặc báo nhập nội dung; không emit |
| CRLF | nội dung nhiều dòng từ Windows | Backend lưu LF; hiển thị đúng dòng |
| Multiline | `Line 1`, Shift+Enter, `Line 2` | Không gửi ở Shift+Enter; nội dung giữ newline |
| Enter | nhấn Enter không giữ Shift | Gửi một message |
| Unicode NFC | ký tự ghép `e + combining acute` | Lưu/so sánh idempotency theo NFC |
| HTML | `<img src=x onerror=alert(1)>` | Hiện nguyên văn như text; không tạo element, không chạy script |
| 2.000 ký tự | chính xác 2.000 Unicode characters | gửi thành công |
| 2.001 ký tự | 2.001 Unicode characters | báo vượt giới hạn, không gửi |
| Emoji | chuỗi emoji trong giới hạn | đếm theo Unicode character policy, không làm vỡ bubble |

Kiểm tra DOM trong Elements: content phải là text node; code frontend không dùng `dangerouslySetInnerHTML`/raw HTML.

## 9. Pagination, prepend và invalid cursor

### CHAT-FE-09: hơn 30 messages

1. Chuẩn bị ít nhất 65 messages.
2. Mở drawer: page đầu có tối đa 30 messages theo thứ tự cũ → mới và scroll ở cuối.
3. Cuộn lên gần đầu: frontend tải page cũ hơn.
4. Sau prepend, message đang nhìn phải giữ gần đúng vị trí; viewport không nhảy lên đầu hoặc xuống cuối.
5. Lặp lại đến khi `has_more = false`; không gọi thêm request vô hạn.

### CHAT-FE-10: invalid cursor

Để kiểm tra UI mà không sửa code:

1. Mở Chrome DevTools → Sources và đặt breakpoint tại `getConversationMessagesApi` trong `src/modules/chat/api/chatApi.js`.
2. Chỉ dừng ở request pagination (request có cursor), không dừng page đầu.
3. Trong Console tại breakpoint, gán tham số `cursor = 'invalid-cursor'`, rồi Resume.
4. Backend phải trả `400 INVALID_CURSOR`.
5. Các message đã tải vẫn còn nguyên; pagination dừng và hiển thị nút Retry.
6. Bỏ breakpoint, bấm Retry; request dùng opaque cursor hợp lệ và tải tiếp.

## 10. Unread, visibility, read cursor và seen

### CHAT-FE-11: unread badge khi drawer đóng

1. Customer giữ trang job mở nhưng đóng drawer.
2. Handyman gửi 3 messages.
3. Customer nhận badge `3` trên nút Message, không toast, không âm thanh.
4. Mở drawer, để tab visible và scroll gần cuối.
5. Sau khi message render, frontend emit `conversation:read`; badge về 0.

### CHAT-FE-12: không read khi chưa thực sự xem

Lặp các tình huống:

- drawer đóng;
- tab ở background/`document.visibilityState = hidden`;
- drawer mở nhưng user đang scroll lên đọc messages cũ, không gần cuối.

Trong cả ba trường hợp không được tiến read cursor tới message mới nhất. Khi đưa tab visible, mở drawer và cuộn gần cuối, read mới được emit.

### CHAT-FE-13: seen và read ở tab khác

1. Customer gửi message cho Handyman.
2. Khi Handyman chưa read, message phía Customer chỉ hiện sent.
3. Handyman mở/scroll tới cuối.
4. Customer nhận `conversation:read_updated`; message tương ứng đổi seen.
5. Mở tab thứ hai của Handyman, read tại tab đó; các tab còn lại phải cập nhật read state mà không gắn nhầm thành partner seen.
6. Read cursor không được lùi khi tải/đọc message cũ.

## 11. Rate limit

### CHAT-FE-14: `RATE_LIMITED`

1. Gửi burst hơn 10 messages thật nhanh. Có thể dùng paste + Enter liên tục; composer khóa trong lúc từng ack nên cần đủ nhanh sau mỗi ack.
2. Khi backend trả `429 RATE_LIMITED`, bubble tương ứng failed.
3. UI hiển thị thời gian cooldown dựa trên `DT.retry_after_ms`, disable gửi trong khoảng đó.
4. Không có vòng lặp tự retry.
5. Hết cooldown, bấm Retry; dùng lại cùng client ID và gửi thành công.

Token bucket refill 5 message/giây, burst tối đa 10. Kết quả có thể thay đổi nhẹ theo tốc độ thao tác nhưng phải có cooldown khi thật sự nhận `RATE_LIMITED`.

## 12. Disconnect, reconnect, room rejoin và message bị bỏ lỡ

### CHAT-FE-15: reconnect

1. Customer và Handyman đang ở room.
2. Tắt mạng Customer hoặc stop backend.
3. Header Customer chuyển `Offline`/`Reconnecting…`; composer không cho gửi mới khi đã xác nhận disconnect.
4. Trong lúc Customer mất kết nối, để Handyman gửi messages nếu backend vẫn chạy. Có thể chỉ chặn mạng ở browser Customer để làm case này.
5. Khôi phục mạng.
6. Socket phải dùng token Redux hiện tại, reconnect và join lại room.
7. Frontend tải metadata/history mới nhất rồi merge message bị bỏ lỡ, không duplicate message cũ.
8. Unread/read tiếp tục đúng.

### CHAT-FE-16: token refresh

Để access token gần hết hạn hoặc thực hiện flow refresh hiện có. Khi Redux token đổi, socket cũ phải leave/disconnect và socket mới handshake bằng `auth.token` mới, sau đó join lại. Network WS không được gửi user ID, role, sender ID hay refresh token trong handshake.

### CHAT-FE-17: `SOCKET_NOT_JOINED`

Dùng Node inspector đặt breakpoint hoặc tạm buộc socket rời room phía backend trước một lần send. Lần gửi đầu nhận `SOCKET_NOT_JOINED`; frontend phải join lại đúng một lần và retry cùng `client_message_id`. Không được loop vô hạn.

## 13. Participant inactive và phục hồi cùng cycle

Chỉ dùng DB development. Ghi lại giá trị `is_active` ban đầu và luôn phục hồi bằng `try/finally` trong script riêng nếu tự động hóa.

1. Khi chat đang hoạt động, đặt Customer A hoặc Handyman B `is_active = false`.
2. Focus lại trang hoặc thực hiện join/send/read.
3. Các đường POST conversation, GET conversation/history và socket join/send/read đều phải nhận `409 PARTICIPANT_INACTIVE`.
4. Drawer chuyển sang **Chat is temporarily locked**, ẩn toàn bộ history, khóa composer và có Retry.
5. Conversation trong DB vẫn `ACTIVE`, không có `closed_reason` mới.
6. Đặt participant về `is_active = true` trong cùng acceptance cycle.
7. Bấm Retry; history và chat hoạt động lại với cùng conversation ID.

Nếu test bằng script backend có DB mutation, chỉ chạy khi `NODE_ENV` không phải production và `CHAT_TEST_ALLOW_DB_MUTATION=true` theo tài liệu backend.

## 14. Lifecycle đóng conversation

Chạy trên `LIFECYCLE_JOB_ID` riêng và chạy cuối cùng. Job cancel có thể đổi trạng thái tài chính hoặc tạo refund.

### CHAT-FE-18: customer reopen/cancel

1. Mở chat ở Customer và Handyman.
2. Customer chọn **Find Another Handyman** hoặc **Cancel Job** trên job test.
3. Transition nghiệp vụ chính vẫn thành công kể cả emit chat là best-effort.
4. Các socket đang trong room nhận `conversation:closed`.
5. Drawer khóa composer, xóa unread, hiển thị reason đúng và nút **Refresh job**.
6. Send/history/join sau đó bị backend từ chối `CONVERSATION_CLOSED`.

Reason mong đợi tùy flow: `CUSTOMER_REOPEN_BIDDING`, `CUSTOMER_CANCELLED_JOB`, `JOB_CANCELLED` hoặc fallback `JOB_RETURNED_TO_BIDDING` khi reconcile không xác định actor.

### CHAT-FE-19: handyman cancel

Với job disposable khác, Handyman chọn **Cannot Continue Job**. Kiểm tra tương tự và ưu tiên reason `HANDYMAN_CANCELLED`.

### CHAT-FE-20: job closed

Nếu có flow kết thúc job, conversation nhận `JOB_CLOSED`. `PARTICIPANT_INACTIVE` tuyệt đối không được xuất hiện như `closed_reason`.

Nếu dùng backend manual script để mutation lifecycle, bắt buộc `CHAT_TEST_CONFIRM_LIFECYCLE_MUTATION=true` và chạy case này cuối cùng.

## 15. Acceptance cycle mới

### CHAT-FE-21: không tái sử dụng conversation cũ

1. Ghi lại conversation ID và `acceptance_cycle = N` của job.
2. Reopen bidding làm conversation cycle N đóng.
3. Hoàn tất một transition thật sự sang `ACCEPTED` cho cycle mới. Callback/request lặp không được tăng thêm lần nữa.
4. Job phải có `acceptance_cycle = N + 1`.
5. Vào trang Accepted và bấm Message.
6. Frontend nhận conversation ID mới, `acceptance_cycle = N + 1`; không hiển thị history cycle cũ.
7. DB vẫn giữ conversation cũ để audit, trạng thái `CLOSED`, reason có thể là `ACCEPTANCE_CYCLE_SUPERSEDED` nếu bị supersede.

## 16. Đọc Network và Socket.IO trong DevTools

REST:

- Network → Fetch/XHR → lọc `/chat/`;
- xem Status, Request Payload, Response `EM/EC/code/DT`;
- GET/POST phải gửi bearer token qua interceptor hiện có.

Socket.IO:

- Network → WS → chọn kết nối tới backend → Messages/Frames;
- handshake chỉ có `auth.token`;
- theo dõi `conversation:join`, `message:send`, `message:new`, `conversation:read`, `conversation:read_updated`, `conversation:closed`;
- join/send/read ưu tiên lỗi qua acknowledgement; `chat:error` chỉ dành cho protocol/socket-level lỗi không gắn ack.

## 17. Bảng lỗi mong đợi trên frontend

| Backend code | HTTP/EC thường gặp | Frontend phải xử lý |
| --- | ---: | --- |
| `CONVERSATION_NOT_FOUND` | 404 | GET discovery coi là chưa có; POST khi mở mới tạo |
| `PARTICIPANT_INACTIVE` | 409 | khóa tạm, ẩn history, Retry; không coi là closed |
| `CONVERSATION_CLOSED` | 409 | khóa composer, unread = 0, notice + Refresh job |
| `CHAT_NOT_ALLOWED_FOR_JOB_STATUS` | 409 | unavailable + Refresh job |
| `ACCEPTANCE_CYCLE_INCONSISTENT` | 409 | unavailable; không tự đoán/sửa dữ liệu |
| `ACCEPTED_DATA_INCONSISTENT` | 409 | unavailable; không tạo conversation |
| `SOCKET_NOT_JOINED` | 409 | join lại một lần, retry cùng message ID |
| `RATE_LIMITED` | 429 | failed bubble + cooldown từ `retry_after_ms`; không loop |
| `CLIENT_MESSAGE_ID_CONFLICT` | 409 | không retry ID cũ; Send as new tạo UUID mới |
| `INVALID_CURSOR` | 400 | giữ message hiện tại, dừng pagination, cho Retry |
| `INVALID_MESSAGE_CONTENT` | 400 | báo validate, không coi đã gửi |
| `MESSAGE_TOO_LONG` | 400 | báo tối đa 2.000 characters |
| `ACK_TIMEOUT` | client | giữ draft + failed bubble + Retry |
| `SOCKET_DISCONNECTED` | client | failed/offline; chờ reconnect rồi Retry |

## 18. SQL audit tùy chọn

Tên bảng có thể khác về chữ hoa/thường tùy cấu hình Sequelize/PostgreSQL. Kiểm tra schema thực tế trước khi chạy.

Conversation theo job/cycle:

```sql
SELECT id, job_id, acceptance_cycle, selected_bid_id, status,
       closed_at, closed_reason, closed_by_user_id, last_message_at,
       customer_last_read_message_id, handyman_last_read_message_id
FROM "Conversations"
WHERE job_id = '<JOB_ID>'
ORDER BY acceptance_cycle;
```

Message và idempotency:

```sql
SELECT id, conversation_id, sender_id, client_message_id, content, "createdAt"
FROM "Messages"
WHERE conversation_id = '<CONVERSATION_ID>'
ORDER BY "createdAt", id;
```

Tìm duplicate không hợp lệ:

```sql
SELECT conversation_id, sender_id, client_message_id, COUNT(*)
FROM "Messages"
GROUP BY conversation_id, sender_id, client_message_id
HAVING COUNT(*) > 1;
```

Kết quả phải là `0 rows`.

## 19. Checklist bàn giao PASS/FAIL

Ghi `PASS`, `FAIL` hoặc `BLOCKED` cùng bằng chứng Network/screenshot:

- [ ] GET discovery không tạo conversation.
- [ ] POST lần đầu 201, lần sau 200 và cùng ID.
- [ ] Customer/Handyman dùng được; outsider nhận 404.
- [ ] Desktop drawer và mobile full-screen đúng 5 breakpoint.
- [ ] Realtime hai chiều và tab thứ hai của sender không duplicate.
- [ ] Optimistic success, ack timeout, retry duplicate và conflict đúng.
- [ ] Empty, multiline, NFC, plain HTML, 2.000/2.001 characters đúng.
- [ ] Pagination >30, prepend giữ scroll và invalid cursor Retry đúng.
- [ ] Unread/visibility/near-bottom/read/seen đúng.
- [ ] Rate limit hiển thị cooldown, không retry loop.
- [ ] Disconnect/reconnect rejoin và lấy message bị bỏ lỡ.
- [ ] Redux token đổi làm socket handshake lại.
- [ ] Participant inactive khóa tạm, re-active dùng lại cùng conversation.
- [ ] Lifecycle emit closed, reason đúng, Refresh job hoạt động.
- [ ] Acceptance cycle mới dùng conversation ID mới, không lộ history cũ.
- [ ] Không có raw HTML, attachment, typing, fake presence, inbox, toast hoặc sound.
- [ ] Console không có uncaught error; Network không có request chat lặp vô hạn.
- [ ] Production build thành công; socket client nằm ở lazy chunk riêng.

Mỗi lỗi nên ghi lại: mã case, tài khoản/role, job ID, conversation ID, acceptance cycle, thời gian, request/ack payload đã che token, console log và bước tái hiện tối thiểu.
