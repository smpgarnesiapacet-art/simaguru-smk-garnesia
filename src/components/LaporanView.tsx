import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import { FaseKurikulum } from '../types';
import {
  calculateAttendanceMetrics,
  computeFinalScore,
  formatTanggalID,
  getPredikat,
  getTindakLanjut,
  getTodayISO,
} from '../utils/calculations';
import {
  exportExcelSheet,
  exportModulAjarPdf,
  exportTablePdf,
  SCHOOL_LOGO_PATH,
} from '../utils/exporters';

type ReportType =
  | 'presensi'
  | 'jurnal'
  | 'nilai'
  | 'promes'
  | 'modul'
  | 'siswa';

const REPORT_TYPES: { id: ReportType; title: string; subtitle: string }[] = [
  {
    id: 'presensi',
    title: 'Rekap Presensi Siswa',
    subtitle: 'Persentase kehadiran H/S/I/A per kelas',
  },
  {
    id: 'jurnal',
    title: 'Jurnal Mengajar Guru',
    subtitle: 'Catatan pertemuan, materi, dan refleksi',
  },
  {
    id: 'nilai',
    title: 'Buku Nilai & KKTP',
    subtitle: 'Rekap nilai akhir dan tindak lanjut remedial',
  },
  {
    id: 'promes',
    title: 'Prota & Promes',
    subtitle: 'Alokasi JP tahunan & semester Kurikulum Merdeka',
  },
  {
    id: 'modul',
    title: 'Modul Ajar Lengkap',
    subtitle: 'Dokumen RPP Plus siap cetak dengan Kop Surat',
  },
  {
    id: 'siswa',
    title: 'Daftar Siswa & Kelas',
    subtitle: 'Data induk siswa rombongan belajar SMK',
  },
];

export function LaporanView() {
  const { state } = useSimaguru();
  const [reportType, setReportType] = useState<ReportType>('nilai');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id ?? ''
  );
  const [selectedFase, setSelectedFase] = useState<FaseKurikulum>('Fase E');
  const [selectedModulId, setSelectedModulId] = useState<string>(
    state.modulList[0]?.id ?? ''
  );

  const selectedClass = state.classes.find((c) => c.id === selectedClassId);
  const selectedModul = state.modulList.find((m) => m.id === selectedModulId);

  const reportPayload = useMemo(() => {
    const sem = state.profile.semester;

    if (reportType === 'presensi') {
      const stats = calculateAttendanceMetrics(
        state.attendanceSessions,
        state.students,
        selectedClassId
      );
      return {
        title: `Rekapitulasi Presensi Siswa · Kelas ${selectedClass?.namaKelas ?? ''}`,
        metaLines: [
          `Mata Pelajaran: ${state.profile.mataPelajaran} · Tahun Ajaran ${state.profile.tahunAjaran} · Semester ${sem}`,
          `Rata-rata Kehadiran Kelas: ${stats.percentage}%`,
        ],
        headers: ['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Kehadiran (%)'],
        rows: stats.perStudent.map((r, i) => [
          i + 1,
          r.student.nis,
          r.student.nama,
          r.hadir,
          r.sakit,
          r.izin,
          r.alpa,
          `${r.percentage}%`,
        ]),
        fileName: `Rekap_Presensi_${selectedClass?.namaKelas ?? 'SMK_Garnesia'}`,
      };
    }

    if (reportType === 'jurnal') {
      const list = state.journals.filter(
        (j) => !selectedClassId || j.classId === selectedClassId
      );
      return {
        title: `Laporan Jurnal Mengajar Guru · Kelas ${selectedClass?.namaKelas ?? ''}`,
        metaLines: [
          `Guru Pengampu: ${state.profile.namaGuru} · Mata Pelajaran: ${state.profile.mataPelajaran}`,
          `Tahun Ajaran ${state.profile.tahunAjaran} · Semester ${sem}`,
        ],
        headers: ['No', 'Tanggal', 'Jam Ke-', 'Kode TP', 'Materi Diajarkan', 'Hadir', 'Refleksi'],
        rows: list.map((j, i) => [
          i + 1,
          formatTanggalID(j.tanggal),
          j.jamKe,
          j.tpKode,
          j.materi,
          `${j.hadirCount} H / ${j.tidakHadirCount} TH`,
          j.refleksi || '-',
        ]),
        fileName: `Jurnal_Mengajar_${selectedClass?.namaKelas ?? 'SMK_Garnesia'}`,
      };
    }

    if (reportType === 'nilai') {
      const classStudents = state.students.filter(
        (s) => s.classId === selectedClassId
      );
      return {
        title: `Daftar Nilai & Ketuntasan KKTP · Kelas ${selectedClass?.namaKelas ?? ''}`,
        metaLines: [
          `Mata Pelajaran: ${state.profile.mataPelajaran} (${selectedClass?.fase ?? ''}) · Semester ${sem} TA ${state.profile.tahunAjaran}`,
          `Bobot: Frm ${state.gradeWeights.formatif}% | SLM ${state.gradeWeights.sumatifLM}% | STS ${state.gradeWeights.sts}% | SAS ${state.gradeWeights.sas}% · KKTP ${state.gradeWeights.kktp}`,
        ],
        headers: ['No', 'NIS', 'Nama Siswa', 'Frm', 'SLM', 'STS', 'SAS', 'Akhir', 'Pred', 'Tindak Lanjut'],
        rows: classStudents.map((st, i) => {
          const g = state.grades.find(
            (x) =>
              x.studentId === st.id &&
              x.classId === selectedClassId &&
              x.semester === sem
          ) ?? { formatif: 75, sumatifLM: 75, sts: 75, sas: 75 };
          const akhir = computeFinalScore(g, state.gradeWeights);
          return [
            i + 1,
            st.nis,
            st.nama,
            g.formatif,
            g.sumatifLM,
            g.sts,
            g.sas,
            akhir,
            getPredikat(akhir),
            getTindakLanjut(akhir, state.gradeWeights.kktp).label,
          ];
        }),
        fileName: `Buku_Nilai_${selectedClass?.namaKelas ?? 'SMK_Garnesia'}_${sem}`,
      };
    }

    if (reportType === 'promes') {
      const tps = state.tpList
        .filter((t) => t.fase === selectedFase && t.semester === sem)
        .sort((a, b) => a.urutan - b.urutan);
      const months =
        sem === 'Ganjil'
          ? ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
          : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
      return {
        title: `Program Semester (${sem}) · ${selectedFase}`,
        metaLines: [
          `Mata Pelajaran: ${state.profile.mataPelajaran} · Tahun Ajaran ${state.profile.tahunAjaran}`,
          `Guru Mata Pelajaran: ${state.profile.namaGuru}`,
        ],
        headers: ['Kode', 'Elemen', 'Materi Pokok', 'JP', ...months],
        rows: tps.map((tp) => [
          tp.kode,
          tp.elemen,
          tp.materiPokok,
          tp.alokasiJP,
          ...months.map((m) => tp.bulanTarget[m] ?? 0),
        ]),
        fileName: `Promes_${selectedFase}_${sem}_SMK_Garnesia`,
      };
    }

    // siswa
    const classStudents = state.students.filter(
      (s) => s.classId === selectedClassId
    );
    return {
      title: `Daftar Induk Siswa · Kelas ${selectedClass?.namaKelas ?? ''}`,
      metaLines: [
        `Kompetensi Keahlian: ${selectedClass?.jurusan ?? '-'} · Wali Kelas: ${selectedClass?.waliKelas ?? '-'}`,
        `Tahun Ajaran ${state.profile.tahunAjaran}`,
      ],
      headers: ['No', 'NIS', 'Nama Lengkap', 'L/P', 'Kontak Orang Tua / Wali'],
      rows: classStudents.map((st, i) => [
        i + 1,
        st.nis,
        st.nama,
        st.jenisKelamin,
        st.kontakWali,
      ]),
      fileName: `Daftar_Siswa_${selectedClass?.namaKelas ?? 'SMK_Garnesia'}`,
    };
  }, [reportType, state, selectedClassId, selectedClass, selectedFase]);

  const handleDownloadPdf = () => {
    if (reportType === 'modul' && selectedModul) {
      void exportModulAjarPdf(selectedModul, state.profile);
      return;
    }
    void exportTablePdf({
      fileName: `${reportPayload.fileName}.pdf`,
      profile: state.profile,
      title: reportPayload.title,
      metaLines: reportPayload.metaLines,
      headers: reportPayload.headers,
      rows: reportPayload.rows,
      landscape: reportType === 'nilai' || reportType === 'promes' || reportType === 'jurnal',
    });
  };

  const handleDownloadExcel = () => {
    if (reportType === 'modul' && selectedModul) {
      const headers = ['Komponen Modul Ajar', 'Uraian'];
      const rows: (string | number)[][] = [
        ['Judul', selectedModul.judul],
        ['Fase / Kelas', `${selectedModul.fase} (${selectedModul.kelasTarget})`],
        ['Materi Pokok', selectedModul.materiPokok],
        ['Alokasi Waktu', selectedModul.alokasiWaktu],
        ['Model Pembelajaran', selectedModul.modelPembelajaran],
        ['Kompetensi Awal', selectedModul.kompetensiAwal],
        ['Profil Pelajar Pancasila', selectedModul.profilPelajarPancasila.join(', ')],
        ['Tujuan Pembelajaran', selectedModul.tujuanPembelajaran],
        ['Kegiatan Pendahuluan', selectedModul.kegiatanPendahuluan],
        ['Kegiatan Inti', selectedModul.kegiatanInti],
        ['Kegiatan Penutup', selectedModul.kegiatanPenutup],
        ['Asesmen', selectedModul.asesmen],
        ['Refleksi', selectedModul.refleksi],
      ];
      exportExcelSheet(
        `Modul_Ajar_${selectedModul.materiPokok.replace(/\s+/g, '_')}.xlsx`,
        'Modul Ajar',
        headers,
        rows
      );
      return;
    }

    exportExcelSheet(
      `${reportPayload.fileName}.xlsx`,
      reportType.toUpperCase(),
      reportPayload.headers,
      reportPayload.rows,
      [
        [state.profile.instansi.toUpperCase()],
        [reportPayload.title],
        ...reportPayload.metaLines.map((l) => [l]),
      ]
    );
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Pusat Laporan &amp; Cetak Dokumen Resmi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ekspor PDF, Excel (.xlsx), dan cetak langsung dengan Kop Surat {state.profile.instansi}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Unduh PDF (.pdf)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Langsung</span>
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="no-print grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((rt) => {
          const active = reportType === rt.id;
          return (
            <button
              key={rt.id}
              type="button"
              onClick={() => setReportType(rt.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? 'border-teal-600 bg-teal-50/60 dark:border-teal-500 dark:bg-teal-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {rt.title}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {rt.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Parameter Filter Bar */}
      <div className="no-print flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {(reportType === 'presensi' ||
          reportType === 'jurnal' ||
          reportType === 'nilai' ||
          reportType === 'siswa') && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Pilih Kelas:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
            >
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.namaKelas} — {c.jurusan}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'promes' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Pilih Fase:
            </label>
            <select
              value={selectedFase}
              onChange={(e) => setSelectedFase(e.target.value as FaseKurikulum)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="Fase E">Fase E (Kelas X)</option>
              <option value="Fase F">Fase F (Kelas XI &amp; XII)</option>
            </select>
          </div>
        )}

        {reportType === 'modul' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Pilih Modul Ajar:
            </label>
            <select
              value={selectedModulId}
              onChange={(e) => setSelectedModulId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
            >
              {state.modulList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.judul}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Printable Document Sheet (Always crisp white paper style) */}
      <div className="print-sheet rounded-xl border border-slate-300 bg-white p-6 text-slate-900 shadow-xs sm:p-10">
        {/* Official Kop Surat */}
        <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            {state.profile.logoDinasDataUrl && (
              <img
                src={state.profile.logoDinasDataUrl}
                alt="Logo Dinas Pendidikan"
                className="h-16 w-16 object-contain"
              />
            )}
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs font-bold tracking-wider text-slate-700">
              PEMERINTAH PROVINSI JAWA BARAT · DINAS PENDIDIKAN
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              {state.profile.instansi.toUpperCase()}
            </div>
            <div className="text-xs text-slate-600">
              {state.profile.alamatSekolah} · NPSN: {state.profile.npsn}
            </div>
            <div className="text-xs text-slate-600">
              {state.profile.teleponEmail}
            </div>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <img
              src={state.profile.logoSekolahDataUrl || SCHOOL_LOGO_PATH}
              alt="Logo Sekolah"
              referrerPolicy="no-referrer"
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        {/* Document Body */}
        {reportType === 'modul' && selectedModul ? (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold uppercase text-slate-900">
                MODUL AJAR KURIKULUM MERDEKA
              </h3>
              <p className="text-xs text-slate-600">
                {selectedModul.judul} · {selectedModul.fase} ({selectedModul.kelasTarget})
              </p>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                {[
                  ['Penyusun / Guru', `${state.profile.namaGuru} (${state.profile.instansi})`],
                  ['Mata Pelajaran / Fase', `${state.profile.mataPelajaran} / ${selectedModul.fase}`],
                  ['Materi Pokok', selectedModul.materiPokok],
                  ['Alokasi Waktu', selectedModul.alokasiWaktu],
                  ['Model Pembelajaran', selectedModul.modelPembelajaran],
                  ['Kompetensi Awal', selectedModul.kompetensiAwal],
                  ['Profil Pelajar Pancasila', selectedModul.profilPelajarPancasila.join(', ')],
                  ['Sarana & Prasarana', selectedModul.saranaPrasarana],
                  ['Tujuan Pembelajaran', selectedModul.tujuanPembelajaran],
                  ['Pemahaman Bermakna', selectedModul.pemahamanBermakna],
                  ['Pertanyaan Pemantik', selectedModul.pertanyaanPemantik],
                  ['Kegiatan Pendahuluan', selectedModul.kegiatanPendahuluan],
                  ['Kegiatan Inti', selectedModul.kegiatanInti],
                  ['Kegiatan Penutup', selectedModul.kegiatanPenutup],
                  ['Asesmen', selectedModul.asesmen],
                  ['Pengayaan & Remedial', selectedModul.pengayaanRemedial],
                  ['Refleksi', selectedModul.refleksi],
                ].map(([label, val]) => (
                  <tr key={label}>
                    <td className="w-48 border border-slate-300 bg-slate-50 px-3 py-2 font-semibold align-top">
                      {label}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 whitespace-pre-line">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <div className="text-center">
              <h3 className="text-base font-bold uppercase text-slate-900">
                {reportPayload.title}
              </h3>
              {reportPayload.metaLines.map((line, i) => (
                <p key={i} className="mt-0.5 text-xs text-slate-600">
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    {reportPayload.headers.map((h) => (
                      <th
                        key={h}
                        className="border border-slate-300 px-2.5 py-2 text-left font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportPayload.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={reportPayload.headers.length}
                        className="border border-slate-300 px-3 py-6 text-center text-slate-500"
                      >
                        Belum ada data untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    reportPayload.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-slate-300 px-2.5 py-2 font-mono text-[11px] tabular-nums"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dual Signature Block */}
        <div className="mt-10 grid grid-cols-2 gap-8 px-4 text-xs text-slate-900">
          <div>
            <div>Mengetahui,</div>
            <div>Kepala {state.profile.instansi}</div>
            <div className="mt-16 font-bold underline">
              {state.profile.kepalaSekolah}
            </div>
            <div className="font-mono text-[11px]">
              NIP. {state.profile.nipKepalaSekolah}
            </div>
          </div>
          <div className="pl-8 sm:pl-20">
            <div>
              {state.profile.kota}, {formatTanggalID(getTodayISO())}
            </div>
            <div>Guru Mata Pelajaran {state.profile.mataPelajaran}</div>
            <div className="mt-16 font-bold underline">
              {state.profile.namaGuru}
            </div>
            <div className="font-mono text-[11px]">
              NIP. {state.profile.nipGuru}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
