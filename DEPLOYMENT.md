## Production Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment
```bash
cp .env.example .env
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Run Application
```bash
npm run start
```

### 5. PM2 Example
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### Notes
- Frontend hasil build akan dilayani langsung oleh Express dari folder `dist`.
- File upload tersimpan di folder `uploads`.
- Konten HTML hasil eksternalisasi tersimpan di folder `content`.
- Database utama tetap memakai `database.sdb`.
