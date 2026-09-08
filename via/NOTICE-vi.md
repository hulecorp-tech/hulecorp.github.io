# VIA (bản Việt hoá) — Thông báo giấy phép & mã nguồn

Thư mục `/via` này là một **bản phân phối lại có chỉnh sửa** của **VIA** — công cụ cấu
hình bàn phím cơ mã nguồn mở, phát hành theo giấy phép **GNU GPL-3.0** (xem `LICENSE`).

Đây **không phải** trang chính thức của VIA. Bản gốc chính thức ở tại https://www.usevia.app

## Nguồn gốc (mã nguồn tương ứng theo GPL-3.0)

- Ứng dụng: **the-via/app** — https://github.com/the-via/app (fork từ commit `352aebd`).
- Cơ sở dữ liệu định nghĩa bàn phím: **the-via/keyboards** — https://github.com/the-via/keyboards
- Bản quyền thuộc về các tác giả của VIA. Giấy phép: GPL-3.0 (giữ nguyên trong `LICENSE`).

## Các thay đổi so với bản gốc

Chỉ thêm phần Việt hoá và điều chỉnh để chạy ở đường dẫn con `/via`:

1. `src/locales/vi.json` — **thêm mới**: bản dịch tiếng Việt toàn bộ chuỗi giao diện.
2. `src/components/menus/language-select.tsx` — thêm `Tiếng Việt` vào danh sách ngôn ngữ.
3. `src/index.tsx` — cấu hình i18next: mặc định `vi`, ghi nhớ lựa chọn qua `localStorage`.
4. `src/utils/device-store.ts` — nạp định nghĩa theo `import.meta.env.BASE_URL` để chạy ở `/via/`.
5. `vite.config.ts` — đặt `base: '/via/'`.

Các tệp đã chỉnh sửa được kèm nguyên văn trong thư mục `_source-changes/`.

## Cách dựng lại (reproduce)

```bash
git clone https://github.com/the-via/app && cd app
# áp lại 5 thay đổi ở trên (xem _source-changes/)
bun install
bun run build      # bun run build:kbs && tsc && vite build
# kết quả nằm ở dist/ — chính là nội dung thư mục /via này
```

Toàn bộ mã nguồn tương ứng của bản chỉnh sửa này = mã nguồn gốc công khai ở hai repo trên,
cộng với các thay đổi được liệt kê và đính kèm tại đây.
