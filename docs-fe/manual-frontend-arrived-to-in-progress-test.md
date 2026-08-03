# Manual frontend test: ARRIVED → QUOTE → PAYMENT → IN_PROGRESS

## 1. Chuẩn bị

- Hai browser đăng nhập Customer owner và selected Handyman; thêm một outsider.
- Job bắt đầu ở `ARRIVED`, deposit `HELD`, Bid `WON`, Chat `ACTIVE`.
- Backend đã chạy rollout trong `manual-quote-policy-rollout.md`.
- Chuẩn bị JPEG/PNG hợp lệ, ảnh lớn hơn 5 MB và WebP.
- DevTools theo dõi Network, Socket.IO và console.

Mỗi mutation phải kiểm tra UI, envelope `{ EM, EC, code, DT }`, canonical
`accepted-details`, Chat và realtime. Không dùng local checklist để cấp action.

## 2. Shared stepper

- Mở Customer Job details ở POSTED/BIDDING và lifecycle ở ARRIVED.
- Resize cùng content container qua 768, 1024, 1366 và 1440px.
- Expected: cùng container width cho cùng variant; 1024px dùng compact nếu mười stage
  không đủ chỗ; không horizontal scroll hoặc thu nhỏ typography.
- `PENDING_DEPOSIT`: effective step Bidding và badge `Deposit pending`.
- `CANCELLATION_REVIEW`/`CANCELLED`: effective step chỉ lấy
  `cancellation.cancelled_from_status`; thiếu phase hiển thị unavailable.
- WARRANTY đứng trước Completed/CLOSED trên visual roadmap. Đây không phải test
  transition backend.

## 3. Evidence và Quote Draft

- Chọn nhiều JPEG/PNG: từng file phải đi qua
  `Uploading → Processing on server → Uploaded`.
- Browser đạt 100% không được hiển thị Uploaded trước response backend.
- File thứ sáu, WebP và file >5 MB bị chặn thân thiện; backend error vẫn là nguồn cuối.
- Sau create Draft, upload/delete và Save, Network có silent `accepted-details`;
  readiness/count/action cập nhật theo response canonical.
- Draft hiển thị canonical warranty và không có input Warranty/Discount.
- Item yêu cầu name, optional description, integer quantity, free-text unit và integer
  VND price. Thử name rỗng/dài, quantity `0`, âm, `1.5`, unit rỗng/dài, hơn 20 items.
- Duration restore đúng hours/minutes; minutes chỉ `0–59`, tổng `1–43.200`.
- Preview dùng integer-string multiplication; backend total sau Save là canonical.
- Đúng 50% không yêu cầu reason; lớn hơn 50% giải thích cần reason và Save lại.
- Giảm dưới ngưỡng rồi Save phải xóa canonical reason/text.
- Có unsaved changes: Submit giải thích phải Save trước và không gọi submit API.
- Sau Submit, lifecycle refetch trước; chỉ load readonly Quote/Evidence khi canonical
  status là `QUOTE_PENDING`.

## 4. QUOTE_PENDING

- Customer thấy Evidence, report, items, selected Bid amount và final Quote amount;
  không thấy variance amount/percent, discount hoặc draft revision.
- Handyman thấy readonly Quote cùng variance audit; outsider nhận 404.
- Accept modal hiển thị Quote total, held deposit, remaining và ghi rõ chưa debit ví.
- Confirm body `{}` chuyển canonical sang `PAYMENT_PENDING`; retry
  `QUOTE_ALREADY_ACCEPTED` không ghi/emit lại.
- Reject modal riêng chỉ có `FINAL_QUOTE_TOO_HIGH`,
  `FINAL_QUOTE_NOT_ACCEPTABLE`; note optional tối đa 500.
- Reject hiển thị 70% Customer/30% Handyman, sau confirm Job `CANCELLED`, Chat đóng và
  redirect legacy details bằng replace.
- Hai Quote-rejection reason không lặp trong cancellation modal QUOTE_PENDING.
- Cancellation thường vẫn đủ reason auto/neutral/mutual/review theo role và phase.
- Accept/reject đồng thời: action thua đóng stale modal, báo thân thiện và refetch.

## 5. PAYMENT_PENDING

- Customer và Handyman thấy accepted Quote/Evidence cùng total, deposit, remaining và
  payment status.
- Customer có `Pay remaining amount`; remaining bằng 0 dùng `Activate Contract`.
- Handyman chỉ chờ và không có payment action.
- Remaining dương: Customer MAIN debit, SYSTEM_ESCROW credit; đúng một transaction,
  Contract và history.
- Remaining bằng 0: không tạo transaction 0 đồng nhưng vẫn tạo Contract.
- Double click/retry `PAYMENT_ALREADY_COMPLETED` không tạo duplicate.
- `INSUFFICIENT_BALANCE`: modal giữ mở, hiển thị `missing_amount`; Top up Wallet mở
  `/customer/wallet?amount=<missing>` trong tab mới; quay lại và Retry.
- Cả hai role có cancellation PAYMENT_PENDING đúng reason/action/preview.
- Review giữ Quote ACCEPTED, deposit HELD, Contract null và Chat ACTIVE.

## 6. IN_PROGRESS và Contract

- Refresh trực tiếp `/jobs/:jobId/lifecycle`; không redirect legacy.
- Hai role thấy Contract number/status, parties, address, report, duration, canonical
  warranty, items, Quote/deposit/remaining/full escrow và timestamps.
- Không thấy discount, OTP, PDF placeholder, transaction IDs hoặc wallet balances.
- Không có cancellation, completion hoặc work-progress action.
- Chat giữ conversation ID, history, unread và draft.
- Outsider/Contract chưa tồn tại nhận safe 404.

## 7. Realtime, responsive và accessibility

- Kiểm tra `JOB_QUOTE_SUBMITTED`, `JOB_QUOTE_ACCEPTED`, `JOB_QUOTE_REJECTED`,
  `JOB_PAYMENT_REQUIRED`, `JOB_PAYMENT_COMPLETED`, `JOB_IN_PROGRESS`.
- Event pairs chỉ tạo một toast và một coalesced refetch.
- Wrong Job/stale cycle bị bỏ qua; reconnect silent-refetch canonical data.
- Test 320×800, 375×800, 768×1024, 1024×768, 1366×768, 1440×900.
- Kiểm tra keyboard, focus trap/restore, labels, contrast, reduced motion và không
  horizontal overflow.

## 8. Regression commands

```bash
npm run build
npm run lint
git diff --check
```

Bundle-size warning và lỗi ESLint baseline được báo riêng, không mở rộng scope.
