> Superseded for ARRIVED and later stages by `manual-frontend-arrived-to-in-progress-test.md`.

# Kiểm thử frontend Job flow từ POSTED đến QUOTE_PENDING

Tài liệu này thay thế phạm vi nghiệm thu của `manual-frontend-posted-to-arrived-test.md`. Manual cũ được giữ lại để đối chiếu regression, không còn là nguồn test hiện hành.

Phạm vi:

```text
POSTED → BIDDING → ACCEPTED → EN_ROUTE → ARRIVED → QUOTE_PENDING
```

Không kiểm thử Customer accept/reject Quote, payment, Contract hoặc `IN_PROGRESS` trong task này.

## 1. State machine và progress model

Backend hiện triển khai transition đến `PAYMENT_PENDING → IN_PROGRESS`. Backend chưa có service transition từ `IN_PROGRESS` sang `WARRANTY` hoặc `CLOSED`; enum Job khai báo `IN_PROGRESS → WARRANTY → CLOSED`.

Vì vậy shared stepper hiển thị:

```text
Posted → Bidding → Accepted → En route → Arrived
→ Quote pending → Payment pending → In progress → Warranty → Completed
```

### P1 — Đủ 10 stage và đúng WARRANTY/CLOSED order

- Precondition: Customer Job Details tại `POSTED`.
- Steps: mở vùng chứa stepper rộng tối thiểu 1088 px và đọc toàn bộ label.
- Expected UI: đúng 10 bước trên; Warranty đứng trước Completed.
- Expected network: không có request riêng cho stepper.
- Common failures: đảo Warranty/Completed, duplicate stage array hoặc raw enum.

### P2 — Screenshot regression POSTED/BIDDING

- Viewport: 1366×768 và 1440×900.
- Steps:
  1. Chụp baseline trước refactor từ branch/commit gốc.
  2. Chụp bản hiện tại.
  3. So sánh cạnh nhau hoặc overlay 50%.
- Expected:
  - circle 30 px;
  - connector 2 px và nối giữa tâm circle;
  - label margin-top 8 px, font 0.75 rem;
  - completed check, current ring và pending neutral giữ visual cũ.
- Regression harness/artifact đã tạo:
  - `docs/visual-regression/job-progress-stepper.html`;
  - `docs/visual-regression/job-progress-before-after-1440.png`;
  - `docs/visual-regression/job-progress-compact-1024.png`.
- Artifact này xác minh component visual. Vẫn cần chụp authenticated POSTED/BIDDING pages khi có fixtures browser đầy đủ.

### P3 — Compact tại 1024 px

- Viewport: 1024×768.
- Steps: mở Customer Job Details và lifecycle workspace.
- Expected:
  - không ép 10 circle vào một hàng;
  - có Stage x of 10, current label, progress bar, previous và next;
  - không font quá nhỏ hoặc horizontal scroll.
- Breakpoint: full mode chỉ bật khi chính container đạt 68 rem/1088 px.

### P4 — Mobile compact

- Viewport: 320×800, 360×800, 390×844, 768×1024.
- Expected: current stage rõ, previous/next đọc được, progressbar có ARIA và không overflow.

### P5 — PENDING_DEPOSIT

- Expected:
  - effective progress giữ ở Bidding;
  - badge riêng “Deposit pending”;
  - không tạo stage thứ 11.

### P6 — Cancellation phase mapping

- `CANCELLATION_REVIEW`: dùng `accepted-details.cancellation.cancelled_from_status`.
- `CANCELLED`: dùng `GET /jobs/:jobId/cancellations/current`.
- Expected:
  - stepper giữ đúng phase gốc;
  - badge Cancellation review/Cancelled vẫn riêng;
  - thiếu phase canonical thì hiển thị progress unavailable, không tự đoán.

## 2. Chuẩn bị ARRIVED/QUOTE

- Customer, selected Handyman và outsider ở ba browser profile.
- Job `ARRIVED`, selected Bid `WON`, deposit `HELD`, participants active và acceptance cycle hợp lệ.
- Bật Network, Console và Socket frames.
- Chuẩn bị JPEG, PNG, WebP, JPEG >5 MB, file rỗng và ít nhất sáu ảnh hợp lệ.

## 3. Privacy tại ARRIVED

### A1 — Customer

- Expected UI: thấy Handyman đang khảo sát, không thấy Draft/items/BEFORE evidence và Chat vẫn hoạt động.
- Expected network: có `accepted-details`; không gọi `/quotes/current` hoặc `/evidence/before`.

### A2 — Handyman

- Expected UI: Evidence section, Create Quote Draft và cancellation chỉ khi backend trả action.
- Expected network: GET Evidence; GET Quote chỉ khi lifecycle DTO cho biết Draft tồn tại.

### A3 — Outsider

- Expected: không xem workspace, không biết Quote/Evidence tồn tại và không leak media URL.

## 4. BEFORE evidence

### E1 — Upload JPEG/PNG tuần tự

- Chọn đồng thời JPEG và PNG.
- Mỗi file phải đi qua: Selected → Uploading x% → Processing on server → Uploaded.
- 100% browser upload chưa được xem là hoàn tất.
- Expected request:
  - hai request tuần tự;
  - multipart field `image`;
  - frontend không gọi Cloudinary;
  - Axios/browser tự tạo boundary.
- Sau mỗi file: silent-refetch `accepted-details` và Evidence list.

### E2 — Một file lỗi không ảnh hưởng file khác

- Chọn JPEG hợp lệ, WebP và PNG hợp lệ.
- Expected: JPEG/PNG thành công; WebP failed; có Retry/Remove; ảnh thành công không mất.

### E3 — UX limits

- WebP, file >5 MB, file rỗng và ảnh thứ sáu bị cảnh báo.
- Đây chỉ là UX mirror; backend validation/error vẫn là nguồn cuối.

### E4 — Server errors

Kiểm tra `BEFORE_EVIDENCE_LIMIT_REACHED`, `IMAGE_TOO_LARGE`, `INVALID_IMAGE_TYPE`, `CLOUDINARY_UPLOAD_FAILED`.

- Expected: friendly text, không raw code, failed item vẫn Retry/Remove.

### E5 — Delete và readiness refresh

- Delete chỉ hiện khi backend trả action.
- Dùng inline confirmation Delete/Keep.
- Sau DELETE: silent-refetch lifecycle/Evidence; xóa ảnh cuối phải cập nhật readiness.

### E6 — Lock sau submit

- Tại `QUOTE_PENDING`: không upload/delete; gallery read-only; không lộ public ID, hash, folder hoặc audit metadata.

## 5. Quote Draft

### Q1 — Create/get idempotent

- Click Create Quote Draft, double click hoặc reload.
- Expected: `QUOTE_DRAFT_CREATED`/`QUOTE_DRAFT_EXISTS`, cùng version 1, không duplicate và lifecycle silent-refetch.

### Q2 — Restore canonical Draft

- Save Draft rồi refresh.
- Expected: fields/items/totals/revision restore từ backend; duration minutes restore đúng hours/minutes; warranty 0 vẫn là `0`.

### Q3 — Duration

- 0h30 → 30; 2h00 → 120.
- Minutes 0–59.
- Tổng 1–43.200 phút.
- 0 hoặc >43.200 bị chặn.

### Q4 — Warranty

- Empty Draft, 0, 1, 3650 và 3651.
- 0 hợp lệ và nghĩa là không bảo hành; 3651 không hợp lệ.

### Q5 — Full replacement items

- Add Labour/Material/Other, Save, xóa/sửa rồi Save lại.
- Request gửi toàn bộ items hiện tại; không gửi line total/subtotal/total.
- Response canonical thay local state.

### Q6 — Quantity decimal và preview

- Test `1`, `1.2`, `1.250`, `0.001`, `1.2345`, `0`.
- Preview dùng decimal string → scaled integer và round half-up từng dòng.
- Không dùng floating-point làm nguồn tiền.
- Sau Save, backend totals là canonical.

### Q7 — Discount, amount và max items

- Discount 0, bằng subtotal, lớn hơn subtotal.
- Total >100.000.000.
- Item thứ 21.
- Expected: UX cảnh báo nhưng backend vẫn validate cuối; Save lỗi không xóa form.

### Q8 — Bid comparison/variance

Sau Save phải thấy canonical subtotal, discount, total, selected Bid, difference và percentage.

- Test dưới 50%, đúng 50%, trên 50%, OTHER thiếu text.
- Frontend không tự quyết định readiness theo threshold local.
- Reason options đúng backend.
- Submit chỉ khả dụng khi backend cho phép.

### Q9 — Revision conflict

- Hai tab Handyman; tab A Save trước, tab B Save revision cũ.
- Expected: friendly conflict, refetch Draft canonical và lifecycle readiness/action.

## 6. Readiness và Submit

### S1 — Readiness refresh

Sau create Draft, upload Evidence, delete Evidence và Save Draft:

- silent-refetch `accepted-details`;
- cập nhật evidence count/readiness/allowed actions;
- không full-page loading;
- không suy luận Submit từ checklist local.

### S2 — Unsaved changes

- Sửa saved-ready Draft nhưng không Save, sau đó click Submit.
- Expected: giải thích phải Save; không request Submit và không tự Save+Submit.

### S3 — Confirmation

- Modal hiển thị canonical saved total, cảnh báo Quote/Evidence bị khóa, Keep editing và Submit Quote.
- Kiểm tra focus trap, Escape và focus restore.

### S4 — Success/idempotency

- Body Submit là `{}`.
- Loading chặn double click.
- `QUOTE_SUBMITTED`/idempotent equivalent đóng modal, canonical refetch và chuyển `QUOTE_PENDING`.
- Chat không remount/mất draft.
- Handyman không nhận duplicate API + socket toast.

## 7. JOB_QUOTE_SUBMITTED

### R1 — Customer

- Event lọc đúng Job/cycle, toast một lần và chỉ lifecycle refetch trước.
- Không tự mở modal.
- Quote/Evidence hooks chỉ GET sau khi canonical status thật sự là `QUOTE_PENDING`.

### R2 — Reconnect

- Ngắt socket, submit từ browser khác rồi reconnect.
- Expected: lifecycle refetch → canonical `QUOTE_PENDING` → sau đó mới tải Quote/Evidence.

## 8. QUOTE_PENDING

### Customer

Hiển thị report, duration/warranty, itemized Quote, totals, selected Bid/difference, variance explanation, BEFORE gallery, submitted time, Partner và Chat.

Không hiển thị Accept Quote, Reject Quote, Pay, Draft revision, raw action enum hoặc Cloudinary metadata.

### Handyman

Quote/Evidence read-only; không upload/delete/save/submit lại; hiển thị chờ Customer; Chat/cancellation tiếp tục hoạt động.

## 9. Cancellation tại QUOTE_PENDING

Customer reasons:

- NO_LONGER_NEEDED, WRONG_JOB_INFORMATION, SCOPE_CHANGED;
- FINAL_QUOTE_TOO_HIGH, FINAL_QUOTE_NOT_ACCEPTABLE;
- HANDYMAN_UNPROFESSIONAL, EXTERNAL_CIRCUMSTANCE, MUTUAL_AGREEMENT, OTHER.

Handyman reasons:

- JOB_OUTSIDE_SKILL, EQUIPMENT_OR_PART_UNAVAILABLE;
- UNSAFE_WORKING_CONDITION, JOB_SCOPE_MISMATCH, CUSTOMER_CHANGED_SCOPE;
- EXTERNAL_CIRCUMSTANCE, MUTUAL_AGREEMENT, OTHER.

Expected preview:

- Customer fault: 30/70.
- Handyman fault: 100/0.
- Neutral: 50/50.
- Quote rejection: 70/30.
- Review giữ deposit HELD và Chat active.
- Mutual chờ đối phương.
- Frontend không gửi classification, tỷ lệ, amount hoặc cycle; backend là kết quả cuối.

## 10. Responsive/accessibility

Kiểm tra 320×800, 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900.

- Không horizontal overflow.
- Evidence một cột mobile, grid desktop.
- Quote items stack mobile.
- Sticky action không che Chat.
- File input có label; delete có accessible name.
- Modal focus trap; loading có text; không chỉ dùng màu.
- Reduced motion vẫn hoạt động.

## 11. Kiểm tra cuối

```bash
npm run build
npm run lint
git diff --check
```

Ghi riêng build/bundle warning, ESLint baseline, source error mới, line-ending warning và browser/screenshot artifact chưa thực hiện nếu môi trường không có browser/authenticated fixtures.

Không xóa `ArrivedStage.jsx` hoặc manual cũ trước khi imports sạch, build pass và browser/screenshot regression hoàn tất.
