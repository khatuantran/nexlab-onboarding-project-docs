/**
 * Seed fixtures for the 3 pilot projects (US-005 follow-up, 2026-04-25).
 *
 * Content is drafted from publicly available info (Google Play / App Store
 * listings, Daikin Vietnam company pages) and is **marked DRAFT** in every
 * section. Treat these as starter content — BA / Dev should refine before
 * the M3 pilot launch.
 *
 * Sources used:
 * - Daikin KTV — https://play.google.com/store/apps/details?id=com.daikin.edu
 *   + https://apps.apple.com/vn/app/daikin-ktv/id1612382299
 *   + https://www.daikin.com.vn/truyen-thong/tin-tuc/chuong-trinh-thuong-kich-hoat-bao-hanh
 * - Daikin Vietnam — https://play.google.com/store/apps/details?id=com.daikin.customer
 *   + https://www.daikin.com.vn/dich-vu
 * - A3 Solutions — internal context (no external sources; project derived from team conventions).
 */

export type SectionType =
  | "business"
  | "user-flow"
  | "business-rules"
  | "tech-notes"
  | "screenshots";

export interface SeedFeature {
  slug: string;
  title: string;
  sections: Record<SectionType, string>;
}

export interface SeedProject {
  slug: string;
  name: string;
  description: string;
  features: SeedFeature[];
}

const DRAFT =
  "> ⚠️ DRAFT — sourced from public app store listings / company pages. Refine before M3 pilot launch.\n\n";

// ===========================================================================
// Project 1 — Daikin KTV (technician app)
// ===========================================================================

const daikinKtvFeatures: SeedFeature[] = [
  {
    slug: "login-otp-ktv",
    title: "Đăng nhập KTV bằng số điện thoại + OTP",
    sections: {
      business: `${DRAFT}## Mục đích

Cho phép kỹ thuật viên (KTV) — bao gồm KTV thuộc đại lý mua trực tiếp từ Daikin Việt Nam và KTV freelance — đăng nhập vào ứng dụng để kích hoạt bảo hành, tích điểm và tham gia chương trình đào tạo.

## Khách hàng

- KTV đại lý chính hãng Daikin.
- KTV tự do (freelance) lắp đặt máy lạnh.

## Giá trị

Verify đúng định danh KTV để chỉ KTV hợp lệ mới được hưởng quyền lợi member, hạn chế giả mạo.
`,
      "user-flow": `${DRAFT}1. Mở app, chọn **Đăng nhập**.
2. Nhập số điện thoại Việt Nam (10 chữ số bắt đầu bằng 0).
3. Nhận OTP qua SMS (6 chữ số, TTL 90 giây).
4. Nhập OTP → server verify.
5. Nếu đây là lần đầu → form điền họ tên + chọn loại KTV (đại lý / freelance) + xác nhận đại lý phụ trách.
6. Success → vào dashboard chính.
`,
      "business-rules": `${DRAFT}- OTP TTL 90 giây, tối đa 3 lần resend trong 5 phút.
- KTV chỉ được duyệt sau khi xác nhận thông tin với đại lý phụ trách (manual review trong v1).
- 1 SĐT = 1 tài khoản KTV duy nhất.
- KTV bị block không thể nhận OTP — server trả lỗi không leak lý do block.
`,
      "tech-notes": `${DRAFT}- Backend: Node.js + Postgres (A3 stack).
- OTP gateway: tích hợp Viettel SMS / VNPT SMS (failover).
- Session: JWT 7 ngày, refresh token 30 ngày.
- Rate limit: 5 lần OTP request / SĐT / giờ.
- Audit log: mọi attempt login lưu IP + user-agent.
`,
      screenshots: `${DRAFT}_Cần screenshot màn hình:_

- Màn nhập số điện thoại.
- Màn nhập OTP với countdown.
- Màn complete profile lần đầu.
`,
    },
  },
  {
    slug: "warranty-activation",
    title: "Kích hoạt bảo hành điện tử",
    sections: {
      business: `${DRAFT}## Mục đích

KTV scan QR/serial number của thiết bị Daikin vừa lắp đặt để kích hoạt bảo hành điện tử cho người tiêu dùng. Mỗi lượt kích hoạt thành công = KTV nhận điểm thưởng + chủ sở hữu nhận thông báo bảo hành active.

## Tại sao quan trọng

Thay quy trình giấy/tem bảo hành cũ — giảm gian lận, audit trail rõ ràng, dữ liệu owner database hóa cho chương trình after-sales.
`,
      "user-flow": `${DRAFT}1. Vào tab **Kích hoạt bảo hành**.
2. Scan QR code trên máy hoặc nhập serial number thủ công (15 ký tự).
3. App verify serial với DB → trả model name + ngày sản xuất.
4. KTV nhập SĐT chủ sở hữu + ngày lắp đặt + địa chỉ lắp đặt.
5. Confirm → server tạo warranty record, gửi SMS xác nhận tới chủ sở hữu.
6. KTV nhận thông báo "+X điểm" tùy theo model.
`,
      "business-rules": `${DRAFT}- Mỗi serial number chỉ kích hoạt 1 lần. Double activate → 409 conflict.
- Ngày lắp đặt phải nằm trong vòng 30 ngày từ thời điểm kích hoạt.
- Điểm thưởng theo model: Inverter cao cấp 100đ, Inverter standard 50đ, Non-inverter 20đ (placeholder).
- Owner SĐT mới sẽ tạo record customer trên Daikin Vietnam app cùng tài khoản.
`,
      "tech-notes": `${DRAFT}- Endpoint: \`POST /api/v1/warranty/activate\`.
- Serial validation: regex + lookup bảng \`products\`.
- Idempotency key: serial number — replay-safe.
- Notification: SMS qua brand name "Daikin"; fallback Zalo OA nếu SMS fail.
`,
      screenshots: `${DRAFT}_Cần ảnh:_

- Màn scan QR.
- Form nhập thông tin chủ sở hữu.
- Màn confirm thành công với điểm cộng.
`,
    },
  },
  {
    slug: "points-momo-redemption",
    title: "Tích điểm + đổi tiền qua MoMo",
    sections: {
      business: `${DRAFT}## Mục đích

KTV tích lũy điểm qua mỗi lượt kích hoạt bảo hành, hoàn thành khóa training, hoặc các chương trình promotion (vd "Kích hoạt hôm nay nhận tiền liền tay"). Điểm có thể quy đổi sang tiền mặt và rút qua ví điện tử MoMo.

## Lý do business

Tạo động lực cho KTV freelance gắn bó với hệ sinh thái Daikin (thay vì nhận lắp đặt cho hãng khác); turnaround nhanh (cùng ngày) tăng retention so với reward chu kỳ tháng.
`,
      "user-flow": `${DRAFT}1. Tab **Điểm thưởng** → xem tổng điểm + lịch sử cộng.
2. Click **Đổi tiền** → chọn số điểm muốn quy đổi.
3. Lần đầu: liên kết ví MoMo (số điện thoại MoMo phải trùng SĐT đăng ký KTV).
4. Confirm → server gọi MoMo Disbursement API → tiền vào ví trong vài giây.
5. Notification "Đã chuyển X đồng".
`,
      "business-rules": `${DRAFT}- Tỉ giá quy đổi: 1 điểm = 1 đồng (placeholder).
- Tối thiểu mỗi lần đổi: 100,000đ.
- SĐT MoMo phải khớp SĐT KTV — mismatch → reject.
- Mỗi tháng tối đa 5 lần đổi (giảm fraud).
- Điểm hết hạn sau 12 tháng kể từ ngày cộng.
`,
      "tech-notes": `${DRAFT}- MoMo Disbursement API tích hợp qua partner code + RSA signature.
- Ledger pattern cho điểm: append-only entries, never mutate balance.
- Webhook MoMo callback retry với idempotency key (\`payoutId\`).
- Phòng case timeout: cron reconcile 30 phút 1 lần.
`,
      screenshots: `${DRAFT}_Pending screenshots._
`,
    },
  },
  {
    slug: "training-classes",
    title: "Khóa đào tạo nghề điều hòa",
    sections: {
      business: `${DRAFT}## Mục đích

Daikin tổ chức các khóa đào tạo (online + offline) cho KTV về kỹ thuật lắp đặt, vận hành, sửa chữa các dòng máy mới. App giúp KTV tìm khóa theo thời gian + địa điểm, đăng ký, tham gia, và nhận chứng chỉ.

## Lợi ích

KTV: nâng cao tay nghề, nhận chứng chỉ Daikin để được phân cấp KTV cao cấp (điểm thưởng cao hơn). Daikin: chuẩn hóa chất lượng dịch vụ trong toàn mạng lưới.
`,
      "user-flow": `${DRAFT}1. Tab **Đào tạo** → list các khóa đang mở.
2. Filter theo địa điểm (thành phố) + thời gian (tuần / tháng) + chủ đề.
3. Click khóa → xem chi tiết: giảng viên, syllabus, học phí (free / có phí), seats còn lại.
4. **Đăng ký** → confirm → seat reserved.
5. Đến ngày: app push reminder + check-in QR tại lớp.
6. Hoàn thành → kết quả + chứng chỉ vào tab **Hồ sơ**.
`,
      "business-rules": `${DRAFT}- 1 KTV không được đăng ký 2 khóa trùng giờ.
- Hủy đăng ký < 24h trước giờ học → bị trừ 50 điểm.
- Khóa offline yêu cầu check-in QR mới được chấm hoàn thành.
- Khóa online: phải xem ≥ 80% video + làm bài quiz đạt 70%.
- Chứng chỉ pdf signed bằng key của Daikin Việt Nam (verify offline).
`,
      "tech-notes": `${DRAFT}- Video streaming: HLS qua Cloudflare Stream.
- QR check-in: rotating code 30 giây để tránh share screenshot.
- Quiz: stored procedures cho chấm điểm tự động.
- Cert PDF: signpdf node lib + key trong AWS KMS.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "service-schedule",
    title: "Quản lý lịch dịch vụ KTV",
    sections: {
      business: `${DRAFT}## Mục đích

KTV xem lịch các yêu cầu dịch vụ (lắp đặt, bảo trì, sửa chữa) được phân công từ phía Daikin Vietnam app (customer side). Cho phép xác nhận nhận lịch, cập nhật trạng thái, ghi chú sau khi hoàn thành.

## Hub kết nối

Đây là điểm giao giữa **Daikin Vietnam app** (customer tạo yêu cầu) và **Daikin KTV app** (technician thực thi). Status sync 2 chiều.
`,
      "user-flow": `${DRAFT}1. Tab **Lịch hôm nay** → list job sorted theo giờ.
2. Click job → xem địa chỉ, thông tin máy, lịch sử bảo hành.
3. Tap **Nhận job** → status: assigned → in-progress.
4. KTV đến nơi → tap **Bắt đầu** + chụp ảnh thiết bị.
5. Hoàn thành → form ghi nhận: vấn đề tìm thấy, linh kiện thay, thời gian.
6. Customer nhận report tự động qua Daikin Vietnam app.
`,
      "business-rules": `${DRAFT}- KTV không thể từ chối job sau khi nhận (phải gọi tổng đài để re-assign).
- Trễ > 30 phút so với lịch hẹn → tự động ping customer + KTV.
- KTV nhận tối đa 8 job / ngày (cap để đảm bảo chất lượng).
- Geo-fence: phải start job khi đã ở trong bán kính 200m từ địa chỉ.
`,
      "tech-notes": `${DRAFT}- Realtime sync giữa 2 app: WebSocket (server-push) + DB notify.
- Geofence: HTML5 Geolocation API + reverse geocoding.
- Photo upload: client compress < 1MB → S3 presigned URL.
- Conflict: optimistic lock theo \`updatedAt\`.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "defect-report",
    title: "Báo cáo lỗi sản phẩm hàng loạt",
    sections: {
      business: `${DRAFT}## Mục đích

Khi KTV phát hiện lỗi pattern trên 1 batch sản phẩm (cùng model + serial range), có thể submit báo cáo để team R&D Daikin Việt Nam điều tra sớm. Công cụ feedback ngược lên hãng từ field.

## Pain trước đây

Trước có app này, KTV phản hồi qua email tổng đài → mất 2-3 tuần để R&D tổng hợp. App giúp gom nhanh + dashboard cho team kỹ thuật theo dõi.
`,
      "user-flow": `${DRAFT}1. Tab **Báo cáo lỗi** → button **Tạo mới**.
2. Chọn model + range serial number (hoặc list cụ thể).
3. Mô tả lỗi (text + ảnh + video tối đa 30s).
4. Mức độ nghiêm trọng: Cosmetic / Functional / Safety.
5. Submit → ticket được tạo, KTV nhận ID để track.
6. R&D respond → push notification.
`,
      "business-rules": `${DRAFT}- Lỗi Safety → escalate ngay sang QA leadership trong 1h.
- Spam protection: KTV submit > 3 báo cáo / ngày → require manual review.
- Báo cáo trùng lặp (cùng model + symptom): merge tự động.
`,
      "tech-notes": `${DRAFT}- Backend: ticket queue Postgres + worker consume → notify Slack channel #qa-daikin.
- Video: chunked upload S3, transcode HLS qua Lambda.
- Search: pgvector cho similarity với báo cáo cũ.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
];

// ===========================================================================
// Project 2 — Daikin Vietnam (customer app)
// ===========================================================================

const daikinVietnamFeatures: SeedFeature[] = [
  {
    slug: "owner-registration",
    title: "Đăng ký tài khoản chủ sở hữu thiết bị",
    sections: {
      business: `${DRAFT}## Mục đích

Chủ sở hữu thiết bị Daikin tạo tài khoản để theo dõi bảo hành, đặt lịch dịch vụ, và nhận thông báo khuyến mãi. Tài khoản được khởi tạo tự động khi KTV kích hoạt bảo hành điện tử (Daikin KTV app), customer chỉ cần claim qua OTP.

## Đối tượng

Cá nhân và doanh nghiệp đang sử dụng máy lạnh / điều hòa Daikin tại Việt Nam.
`,
      "user-flow": `${DRAFT}1. Mở app → màn welcome.
2. Nhập SĐT đã được KTV gắn lúc kích hoạt bảo hành.
3. App detect: nếu có warranty record → "Bạn có X thiết bị Daikin đã đăng ký" → tap **Claim**.
4. OTP qua SMS để xác nhận.
5. Hoàn thiện profile (họ tên, email, địa chỉ giao hàng nếu có).
6. Vào dashboard hiển thị danh sách thiết bị.
`,
      "business-rules": `${DRAFT}- 1 SĐT = 1 tài khoản; có thể link nhiều thiết bị.
- Tài khoản không có thiết bị nào (manual signup) → tạo nhưng nhắc "Mua máy Daikin để dùng đầy đủ tính năng".
- Email optional v1; bắt buộc v2 cho password recovery.
`,
      "tech-notes": `${DRAFT}- Cùng pool user với Daikin KTV (bảng \`users\` shared) phân biệt qua \`role\` enum.
- OTP gateway shared với KTV app — rate limit chung theo SĐT.
- Tài khoản auto-created (claim flow) khác với tài khoản signup direct → flag \`needsClaim: true\`.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "warranty-status",
    title: "Tra cứu trạng thái bảo hành",
    sections: {
      business: `${DRAFT}## Mục đích

Customer kiểm tra: thiết bị còn bảo hành không, ngày hết hạn, các điều kiện kèm theo. Trước đây phải gọi tổng đài, giờ self-service trong app.

## Tích hợp

Hiển thị warranty record được tạo lúc KTV kích hoạt (xem feature \`warranty-activation\` trong Daikin KTV).
`,
      "user-flow": `${DRAFT}1. Tab **Thiết bị của tôi** → list các máy.
2. Tap 1 máy → xem chi tiết: model, serial, ngày lắp đặt, ngày hết bảo hành, KTV phụ trách.
3. Status badge: **Còn bảo hành** (xanh) / **Sắp hết** (vàng, < 30 ngày) / **Hết bảo hành** (xám).
4. Tap **Đặt lịch bảo trì** → flow ở feature \`maintenance-schedule\`.
`,
      "business-rules": `${DRAFT}- Thời hạn bảo hành: 1 năm với non-inverter, 2 năm inverter standard, 3 năm inverter cao cấp + 10 năm máy nén.
- Bảo hành không bao gồm: lỗi do thiên tai, tự ý sửa chữa bởi KTV không thuộc Daikin network.
- Hiển thị "Sắp hết" 30 ngày trước khi hết hạn → push notification gợi ý gia hạn (defer v2).
`,
      "tech-notes": `${DRAFT}- Read-only view của bảng \`warranty_records\` shared với KTV app.
- Cache 24h ở client; refresh khi pull-to-refresh.
- Cảnh báo "Sắp hết hạn": cron daily push qua FCM.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "maintenance-schedule",
    title: "Đặt lịch bảo trì / sửa chữa",
    sections: {
      business: `${DRAFT}## Mục đích

Customer chọn 1 thiết bị → đặt lịch bảo trì định kỳ hoặc sửa chữa khi có sự cố. App tự động gợi ý KTV gần nhất + còn slot trống.

## Hub

Yêu cầu này gửi sang **Daikin KTV app** vào lịch của KTV được assign (xem feature \`service-schedule\` ở KTV side).
`,
      "user-flow": `${DRAFT}1. Tab **Đặt dịch vụ** → chọn thiết bị.
2. Chọn loại: **Bảo trì định kỳ** (vệ sinh) / **Sửa chữa** (mô tả triệu chứng).
3. Chọn ngày + khung giờ (8-10h, 10-12h, 14-16h, 16-18h).
4. App gợi ý 3 KTV gần nhất → customer chọn 1.
5. Confirm → ticket created, ETA push tới KTV.
6. Customer nhận SMS xác nhận + countdown trong app.
`,
      "business-rules": `${DRAFT}- Khoảng đặt trước tối thiểu: 4h trước giờ hẹn.
- Cancel > 2h trước giờ hẹn: free; < 2h: tính phí 50% (defer v2).
- Customer không reschedule quá 2 lần / ticket.
- Bảo trì định kỳ trong bảo hành: free; ngoài bảo hành: báo giá theo feature \`service-quote\`.
`,
      "tech-notes": `${DRAFT}- KTV matching: query \`ktv_locations\` table với PostGIS \`ST_DWithin\` + filter "available slot".
- Booking: pessimistic lock slot trong 60s.
- ETA push: kết hợp Google Distance Matrix API + KTV current location (KTV opt-in).
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "service-quote",
    title: "Báo giá dịch vụ trước khi sửa chữa",
    sections: {
      business: `${DRAFT}## Mục đích

Khi yêu cầu là sửa chữa (không phải bảo trì định kỳ), KTV chẩn đoán và gửi báo giá qua app trước khi customer chấp thuận sửa. Tránh tranh cãi giá sau khi hoàn thành.

## Tin tưởng

Customer thấy chi tiết linh kiện + công + tổng → quyết định approve / decline. Nếu decline → KTV chỉ tính phí chẩn đoán cố định.
`,
      "user-flow": `${DRAFT}1. KTV sau khi chẩn đoán → submit báo giá qua KTV app.
2. Customer nhận push notification "Có báo giá mới cho yêu cầu #ABC".
3. Mở app → xem báo giá: list linh kiện, công, tổng, ghi chú KTV.
4. **Approve** → KTV bắt đầu sửa.
5. **Decline** → KTV chỉ tính phí chẩn đoán + đóng ticket.
6. **Yêu cầu thương lượng** → chat trong app với KTV.
`,
      "business-rules": `${DRAFT}- Báo giá có hiệu lực 24h, sau đó cần re-issue.
- Customer phải approve trước khi KTV thay linh kiện > 200,000đ.
- Phí chẩn đoán: 100,000đ (placeholder) — miễn phí nếu approve sửa.
- Tranh cãi: escalate sang Daikin support tổng đài.
`,
      "tech-notes": `${DRAFT}- Quote model: \`{ items: [{name, qty, unitPrice}], laborFee, total }\`.
- E-signature flow: customer tap approve → server lưu hash + timestamp.
- Chat: dùng SSE đơn giản (không cần realtime <1s).
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "post-service-report",
    title: "Báo cáo tình trạng thiết bị sau bảo trì",
    sections: {
      business: `${DRAFT}## Mục đích

Sau mỗi lần bảo trì / sửa chữa, customer nhận báo cáo từ KTV: hình ảnh trước / sau, các thông số đo (gas, áp suất), khuyến nghị chăm sóc tiếp theo. Tăng minh bạch + giáo dục customer.

## Giá trị marketing

Báo cáo lưu trong app làm "lịch sử thiết bị" → khi bán lại máy có data đầy đủ → giá trị resale cao hơn.
`,
      "user-flow": `${DRAFT}1. KTV hoàn thành job → submit report qua KTV app: ảnh, video, thông số.
2. Customer nhận push "Báo cáo cho yêu cầu #ABC đã sẵn sàng".
3. Mở app → xem báo cáo full.
4. **Đánh giá KTV** (1-5 sao + comment).
5. **Lưu vào lịch sử thiết bị** (tự động).
6. Optional: share PDF báo cáo qua Zalo.
`,
      "business-rules": `${DRAFT}- KTV phải submit report trong 24h sau khi đóng job; quá hạn → giảm điểm KTV.
- Customer rating < 3 sao → escalate Daikin support liên hệ trong 48h.
- Photo bắt buộc: trước (khi đến) + sau (khi xong) tối thiểu 2 ảnh.
`,
      "tech-notes": `${DRAFT}- Report PDF generation: Puppeteer (Node) → S3.
- Hash báo cáo lưu blockchain test (defer v2 — proof of integrity).
- Rating ảnh hưởng score KTV: tính theo Wilson lower bound interval.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
];

// ===========================================================================
// Project 3 — A3 Solutions (internal)
// ===========================================================================

const a3SolutionsFeatures: SeedFeature[] = [
  {
    slug: "new-employee-onboarding",
    title: "Onboarding nhân viên mới",
    sections: {
      business: `${DRAFT}## Mục đích

Nhân viên mới của A3 Solutions có 1 nơi tập trung để hiểu các project đang chạy (Daikin KTV, Daikin Vietnam, ...), đọc spec, làm theo checklist setup môi trường dev. Đây chính là lý do portal này tồn tại.

## Đối tượng

- Dev mới (FE / BE / Fullstack).
- BA / PM mới gia nhập team.
- Intern.
`,
      "user-flow": `${DRAFT}1. Login bằng tài khoản công ty.
2. Landing page hiển thị catalog các project active.
3. Click project → đọc 5 section của từng feature.
4. Search keyword (vd "OTP") → xem cross-project hits.
5. Theo checklist trong tech-notes để setup local dev.
`,
      "business-rules": `${DRAFT}- Mọi authenticated user xem được toàn bộ project (FR-PROJ-001 access model).
- Admin tạo + edit + archive project; author edit feature + section.
- Onboarding "completed" status: defer v2 (chưa có metric).
`,
      "tech-notes": `${DRAFT}- Repo: \`nexlab-onboarding-project-docs\`.
- Stack: pnpm monorepo, React + Vite (web), Express + Drizzle (api), Postgres + Redis.
- Setup: \`pnpm docker:up && pnpm db:migrate && pnpm db:seed && pnpm dev\`.
- Spec gốc: [.specs/00-vision.md](../../.specs/00-vision.md).
`,
      screenshots: `${DRAFT}_Self-referential — chính là app này._
`,
    },
  },
  {
    slug: "client-project-tracking",
    title: "Quản lý dự án khách hàng",
    sections: {
      business: `${DRAFT}## Mục đích

Internal tool theo dõi các dự án A3 đang dev cho khách: trạng thái, milestone, người phụ trách, deadline. Trước đây dùng Excel + Notion rời rạc.

## Đối tượng

PM, BA, Tech Lead — không cho dev junior xem (sẽ thấy commercial info).
`,
      "user-flow": `${DRAFT}1. Login với role PM/Lead.
2. Dashboard list các project active.
3. Click 1 project → xem timeline, milestone, % complete, blockers.
4. Update status milestone → push notification team.
5. Xuất report PDF cho client meeting.
`,
      "business-rules": `${DRAFT}- Chỉ role PM/Lead xem được commercial info (giá, manday).
- Milestone slip > 7 ngày → auto-flag escalate.
- Client view (read-only public link) chỉ hiển thị progress %, không hiển thị blockers nội bộ.
`,
      "tech-notes": `${DRAFT}- Data: bảng \`projects\`, \`milestones\`, \`assignments\`.
- Charts: recharts cho timeline gantt-style.
- Public client link: signed URL TTL 7 ngày.
- Defer v2: tích hợp Jira webhook để auto-sync milestone từ epic.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "weekly-timesheet",
    title: "Báo cáo timesheet hàng tuần",
    sections: {
      business: `${DRAFT}## Mục đích

Mỗi nhân viên log số giờ làm việc theo project + task hàng tuần. Output cho payroll + billing client (T&M projects).

## Đối tượng

Tất cả nhân viên fulltime + freelancer.
`,
      "user-flow": `${DRAFT}1. Mỗi thứ 6 cuối tuần: bot reminder qua Slack.
2. User mở app → tab **Timesheet** → tuần hiện tại.
3. Add row: project + task + hours per day (Mon-Sun).
4. Submit → manager nhận notification để duyệt.
5. Manager approve / reject với note.
`,
      "business-rules": `${DRAFT}- Tổng giờ tuần ≥ 40h cho fulltime; cảnh báo nếu < 30h hoặc > 60h.
- Quá hạn submit (sau thứ 2 tuần kế): khóa edit, phải gửi email xin ngoại lệ.
- Manager tự log riêng (không tự duyệt).
`,
      "tech-notes": `${DRAFT}- Stack: same monorepo (sub-app dự kiến).
- Slack reminder: cron mỗi thứ 6 16h chạy worker push DM.
- Approve workflow: state machine \`draft → submitted → approved | rejected\`.
- Export CSV cho payroll: \`/timesheets/export?from=&to=\`.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "leave-request",
    title: "Đăng ký nghỉ phép",
    sections: {
      business: `${DRAFT}## Mục đích

Replace giấy / email cho leave request. Nhân viên đăng ký nghỉ → manager duyệt → HR theo dõi balance.

## Đối tượng

Toàn công ty.
`,
      "user-flow": `${DRAFT}1. Tab **Nghỉ phép** → button **Đăng ký mới**.
2. Chọn loại (annual / sick / unpaid) + ngày bắt đầu + số ngày.
3. Note lý do.
4. Submit → email/Slack manager.
5. Manager approve → balance trừ; HR thấy trong dashboard.
`,
      "business-rules": `${DRAFT}- Annual leave: 12 ngày / năm, prorate theo tháng vào.
- Sick leave: bắt buộc giấy bác sĩ nếu > 2 ngày liên tiếp.
- Đăng ký < 3 ngày trước: cần approve khẩn (gọi điện manager).
- Trong probation (60 ngày đầu): không được nghỉ annual leave.
`,
      "tech-notes": `${DRAFT}- Balance ledger pattern (cùng pattern points của KTV app).
- Calendar integration: Google Calendar API push event "Leave: <name>".
- Defer v2: half-day leave granularity.
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
  {
    slug: "internal-knowledge-base",
    title: "Knowledge base nội bộ",
    sections: {
      business: `${DRAFT}## Mục đích

Tài liệu nội bộ A3: process, code review checklist, deployment runbook, technical decisions. Khác với portal onboarding (project-specific) — đây là cross-project guide.

## Khác biệt

Portal này (project docs) trả lời "Project X làm gì?". KB trả lời "Quy trình A3 deploy code thế nào?".
`,
      "user-flow": `${DRAFT}1. Tab **KB** → cây thư mục theo chủ đề (Process / Engineering / Tools / People).
2. Search keyword cross-doc.
3. Edit nếu role admin / staff.
4. Subscribe doc → nhận email khi có update.
`,
      "business-rules": `${DRAFT}- Mọi nhân viên đọc được; chỉ admin / lead viết.
- Doc có owner + reviewer; reviewer phải approve change > 50 dòng.
- Stale check: doc không touch trong 6 tháng → flag "Cần review".
`,
      "tech-notes": `${DRAFT}- Stack riêng — Outline (open source) self-hosted.
- SSO với Google Workspace.
- Search: Outline native (Postgres tsvector).
`,
      screenshots: `${DRAFT}_Pending._
`,
    },
  },
];

// ===========================================================================
// Aggregate
// ===========================================================================

export const PILOT_PROJECTS: SeedProject[] = [
  {
    slug: "daikin-ktv",
    name: "Daikin KTV",
    description:
      "Ứng dụng dành cho kỹ thuật viên (KTV) lắp đặt + bảo trì máy lạnh Daikin tại Việt Nam: kích hoạt bảo hành điện tử, tích điểm thưởng đổi tiền qua MoMo, đăng ký khóa đào tạo, quản lý lịch dịch vụ.",
    features: daikinKtvFeatures,
  },
  {
    slug: "daikin-vietnam",
    name: "Daikin Vietnam",
    description:
      "Ứng dụng dành cho người dùng cuối (chủ sở hữu thiết bị Daikin): tra cứu bảo hành, đặt lịch bảo trì / sửa chữa, nhận báo giá trước, xem báo cáo tình trạng thiết bị sau dịch vụ.",
    features: daikinVietnamFeatures,
  },
  {
    slug: "a3-solutions",
    name: "A3 Solutions",
    description:
      "Hệ thống nội bộ A3 Solutions: portal onboarding nhân viên mới, theo dõi dự án khách hàng, timesheet hàng tuần, đăng ký nghỉ phép, knowledge base nội bộ.",
    features: a3SolutionsFeatures,
  },
];
