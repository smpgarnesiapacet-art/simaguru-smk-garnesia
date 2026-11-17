import React from 'react';
import { X } from 'lucide-react';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuideModal({ open, onClose }: GuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Panduan Penerapan: GitHub, Supabase &amp; Vercel
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              SIMAGURU SMK Garnesia · Kurikulum Merdeka (Fase E &amp; Fase F)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Tutup panduan"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              1. Setup Database di Supabase
            </h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              <li>Buat project baru di dashboard Supabase.</li>
              <li>Buka menu <strong>SQL Editor → New Query</strong>, lalu salin dan jalankan isi berkas <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">supabase/schema.sql</code>.</li>
              <li>Buka <strong>Project Settings → API</strong> untuk menyalin <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">Project URL</code> dan <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">anon public key</code>.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              2. Push Kode ke GitHub &amp; Deploy di Vercel
            </h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              <li>Push seluruh repositori proyek ini ke GitHub (<code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">vercel.json</code> sudah tersedia otomatis).</li>
              <li>Di Vercel, klik <strong>Add New Project</strong> dan impor repositori GitHub Anda (Framework Preset: <strong>Vite</strong>).</li>
              <li>Masukkan Environment Variables di Vercel: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">VITE_SUPABASE_URL</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">VITE_SUPABASE_ANON_KEY</code>, dan opsional <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">VITE_WORKSPACE_ID</code>.</li>
              <li>Klik <strong>Deploy</strong>. Seluruh perubahan data otomatis tersinkronisasi ke tabel <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">simaguru_workspaces</code> di Supabase.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              3. Menjalankan Secara Lokal
            </h3>
            <p className="mt-1.5">
              Jalankan <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">npm install</code> lalu <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">npm run dev</code> di <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">http://localhost:3000</code>. Tanpa <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">.env.local</code> Supabase, aplikasi tetap berjalan lancar memakai penyimpanan lokal.
            </p>
          </section>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
