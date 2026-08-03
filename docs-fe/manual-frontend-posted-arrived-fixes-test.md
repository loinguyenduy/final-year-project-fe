# Manual browser test — POSTED → ARRIVED fixes

## 1. Shared stepper

- Mở cùng Job ở Customer details khi POSTED/BIDDING/CANCELLED và lifecycle khi ACCEPTED.
- 1366/1440px: vùng đủ rộng hiển thị đủ 10 stage với cùng circle/connector/typography.
- 1024px và container không đủ rộng: compact previous/current/next, không chữ quá nhỏ và không scroll ngang.
- 320/375/768px: không overflow.
- `PENDING_DEPOSIT`: effective BIDDING và badge `Deposit pending`.
- `CANCELLED`: effective phase lấy từ `job.cancellation.cancelled_from_status`, badge `Cancelled`.
- Xóa/ẩn cancellation DTO trong response test: hiển thị safe unavailable, không tự suy luận phase.

## 2. Edit POSTED Job

- Nút Edit chỉ xuất hiện khi backend trả `EDIT_JOB`.
- Route `/customer/my-jobs/:id/edit` refresh trực tiếp được.
- Form restore service, description, schedule, budget, ảnh và location summary.
- Không chạm location: request gửi `location_changed=false`, backend giữ snapshot.
- Chọn Change location rồi test option 1/2/3, geocode/GPS/map confirmation như Create Job.
- Giữ/xóa ảnh cũ, thêm ảnh mới; tổng UI tối đa 5 nhưng vẫn hiển thị backend error nếu server từ chối.
- First Bid đến trong lúc form mở: Save hiển thị conflict thân thiện và quay về canonical details.
- Không có full-page reload.

## 3. Early cancellation

- POSTED có Edit và cancellation link; BIDDING chỉ có cancellation link.
- Modal có 5 reasons, `OTHER` bắt buộc note và counter 500.
- Success redirect/refetch sang `CANCELLED`; stepper giữ phase gốc và badge Cancelled.
- Retry/double-click không tạo toast hoặc request trùng.
- My Jobs cập nhật không cần F5.

## 4. Realtime hai role

- Hai browser Customer/Handyman mở cùng Job.
- Submit Bid đầu tiên: Customer details/list chuyển POSTED → BIDDING và hiện Bid không cần F5.
- Update/withdraw Bid: Customer nhận canonical Bid list; withdraw cuối chuyển về POSTED.
- Customer accept + deposit: selected Handyman tự vào lifecycle; losing bidder ở legacy details/My Jobs và thấy `LOST`, không bị redirect vào workspace không có quyền.
- Early cancellation: mọi bidder thấy `EXPIRED`/Cancelled.
- Disconnect/reconnect socket: đúng một silent refetch; không duplicate toast/listener.

## 5. ACCEPTED layout

- Desktop: stage và Job details nằm liên tiếp trong main column; Partner/financial rail bên phải không tạo khoảng trắng lớn.
- 1024px trở xuống: một cột, thứ tự stage → Job details → Partner/financial; Chat không remount.

## 6. ARRIVED Quote

- Quote editor không có Standard warranty card/input.
- Save dưới/đúng 50% variance: không hiện Variance reason.
- Save trên 50%: canonical readiness hiện warning và reason field; nhập reason rồi Save lại.
- Giảm về `<=50%`: reason/text được backend clear và field biến mất.
- Quote total thấp hơn held deposit: Save thành công với warning/toast, readiness false, Submit bị khóa.
- Quote bằng deposit: submit được; Customer thấy remaining 0.
- Với dữ liệu legacy invalid, Accept modal hiển thị cảnh báo thay vì ba dòng `Not available` và nút Accept bị khóa.

## 7. Regression và checks

- GPS Create Job, Bid compare/accept, lifecycle Chat, Arrival confirm/reject và cancellation sau ACCEPTED không đổi.
- Customer không thấy raw GPS Handyman hoặc financial metadata nội bộ.
- Chạy `npm run build`, `npm run lint` và `git diff --check`.
- Nếu lint dừng tại `eslint.config.js` với `recommended` undefined, ghi nhận là baseline; không sửa config ngoài scope.
