# Hướng dẫn sử dụng Git cho dự án Cobadalat

## Thông tin repository
- URL: https://github.com/aktruong/cobadalat
- Branch chính: main

## Các lệnh Git cơ bản

### 1. Kéo code từ GitHub về
```bash
git pull origin main
```

### 2. Reset về trạng thái trên GitHub
```bash
git fetch origin
git reset --hard origin/main
```

### 3. Xem lịch sử commit
```bash
git log
```

### 4. Quay lại một commit cụ thể
```bash
git checkout <commit-id>
```

### 5. Tạo branch mới
```bash
git checkout -b <tên-branch>
```

### 6. Push code lên GitHub
```bash
git add .
git commit -m "mô tả thay đổi"
git push origin main
```

## Lưu ý quan trọng
- Luôn commit và push code thường xuyên để backup
- Kiểm tra kỹ trước khi push code lên branch main
- Nếu có lỗi, có thể dễ dàng kéo code về trạng thái ổn định trước đó
- Mọi thay đổi đều được lưu trên GitHub và có thể khôi phục

## Liên hệ
- Repository: https://github.com/aktruong/cobadalat
- Nếu có vấn đề về git, vui lòng liên hệ quản trị viên 