# SIMAGURU SMK Garnesia

**Sistem Administrasi Guru & Pembelajaran Digital (Kurikulum Merdeka)** untuk guru Matematika SMK (**Wendi Supriadi · SMK Garnesia · Fase E & Fase F**).

## Fitur Utama
- **Dashboard Utama**: Jadwal mengajar harian, ringkasan KPI kelas/siswa/kehadiran/TP, dan kalender agenda akademik.
- **Manajemen Data Master**: Profil guru & sekolah (dengan pratinjau Kop Surat), kelas & jurusan SMK, serta data siswa dengan fitur import & ekspor Excel (`.xlsx`/`.csv`).
- **Perangkat Ajar Kurikulum Merdeka**: Pengelolaan CP, TP/ATP Matematika SMK, generator Modul Ajar (RPP Plus) siap cetak PDF, serta matriks Prota & Promes otomatis.
- **Jurnal Mengajar & Presensi**: Checklist kehadiran harian (`H/S/I/A`) dengan rekap persentase otomatis dan catatan jurnal refleksi guru.
- **Penilaian & Asesmen Digital**: Buku nilai dengan bobot dinamis (Formatif, Sumatif LM, STS, SAS), toolbar simbol matematika, ambang KKTP, serta rekomendasi Pengayaan/Remedial.
- **Pusat Laporan & Cetak Dokumen**: Pratinjau & ekspor resmi PDF (Kop Surat & Tanda Tangan) dan Excel (`.xlsx`).

## Panduan Penerapan (GitHub + Supabase + Vercel)

### 1. Siapkan Database di Supabase
1. Buat project baru di [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** → **New Query**, lalu jalankan isi file `supabase/schema.sql`.
3. Buka **Project Settings** → **API** dan catat:
   - `Project URL` (`VITE_SUPABASE_URL`)
   - `anon / public key` (`VITE_SUPABASE_ANON_KEY`)

### 2. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit SIMAGURU SMK Garnesia"
git branch -M main
git remote add origin https://github.com/USERNAME/simaguru-smk-garnesia.git
git push -u origin main
```

### 3. Deploy ke Vercel
1. Login ke [Vercel](https://vercel.com) → **Add New Project** → pilih repositori GitHub Anda.
2. Framework Preset akan otomatis terdeteksi sebagai **Vite** (sesuai `vercel.json`).
3. Tambahkan **Environment Variables**:
   - `VITE_SUPABASE_URL` = URL project Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = anon key Supabase Anda
   - `VITE_WORKSPACE_ID` = `smk-garnesia-wendi` (opsional)
4. Klik **Deploy**. Setelah selesai, seluruh data yang diubah di aplikasi akan tersinkronisasi otomatis ke tabel `simaguru_workspaces` di Supabase.

## Menjalankan Secara Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:3000`. Jika `VITE_SUPABASE_URL` belum diisi pada `.env.local`, aplikasi tetap berjalan normal menggunakan penyimpanan lokal (`data/simaguru-db.json` & `localStorage`).
