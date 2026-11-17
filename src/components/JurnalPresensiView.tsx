import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import {
  AttendanceSession,
  AttendanceStatus,
  TeachingJournal,
} from '../types';
import {
  calculateAttendanceMetrics,
  formatTanggalID,
  getTodayISO,
} from '../utils/calculations';
import { exportExcelSheet, exportTablePdf } from '../utils/exporters';

type JurnalTab = 'absensi' | 'jurnal';

interface JurnalPresensiViewProps {
  preselectedClassId?: string;
}

export function JurnalPresensiView({ preselectedClassId }: JurnalPresensiViewProps) {
  const { state, updateState } = useSimaguru();
  const [activeTab, setActiveTab] = useState<JurnalTab>('absensi');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    preselectedClassId || state.classes[0]?.id || ''
  );

  useEffect(() => {
    if (preselectedClassId) {
      setSelectedClassId(preselectedClassId);
    }
  }, [preselectedClassId]);

  // Attendance form state
  const [attDate, setAttDate] = useState(getTodayISO());
  const [pertemuanKe, setPertemuanKe] = useState(16);
  const [materiSingkat, setMateriSingkat] = useState(
    'Latihan Soal & Pembahasan Materi Berjalan'
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const classStudents = useMemo(
    () => state.students.filter((s) => s.classId === selectedClassId),
    [state.students, selectedClassId]
  );

  const [entryMap, setEntryMap] = useState<
    Record<string, { status: AttendanceStatus; keterangan: string }>
  >({});

  useEffect(() => {
    // Initialize checklist when class changes and not editing an existing session
    if (editingSessionId) return;
    const init: Record<string, { status: AttendanceStatus; keterangan: string }> = {};
    for (const st of classStudents) {
      init[st.id] = { status: 'H', keterangan: '' };
    }
    setEntryMap(init);
  }, [selectedClassId, classStudents, editingSessionId]);

  const classSessions = useMemo(
    () =>
      [...state.attendanceSessions]
        .filter((s) => s.classId === selectedClassId)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [state.attendanceSessions, selectedClassId]
  );

  const attendanceStats = useMemo(
    () =>
      calculateAttendanceMetrics(
        state.attendanceSessions,
        state.students,
        selectedClassId
      ),
    [state.attendanceSessions, state.students, selectedClassId]
  );

  const markAllPresent = () => {
    const next: Record<string, { status: AttendanceStatus; keterangan: string }> = {};
    for (const st of classStudents) {
      next[st.id] = { status: 'H', keterangan: '' };
    }
    setEntryMap(next);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || classStudents.length === 0) return;
    const entries = classStudents.map((st) => ({
      studentId: st.id,
      status: entryMap[st.id]?.status ?? 'H',
      keterangan: entryMap[st.id]?.keterangan?.trim() || undefined,
    }));

    if (editingSessionId) {
      updateState(
        (prev) => ({
          ...prev,
          attendanceSessions: prev.attendanceSessions.map((s) =>
            s.id === editingSessionId
              ? {
                  ...s,
                  tanggal: attDate,
                  pertemuanKe,
                  materiSingkat,
                  entries,
                }
              : s
          ),
        }),
        'Data presensi berhasil diperbarui'
      );
      setEditingSessionId(null);
    } else {
      const created: AttendanceSession = {
        id: `att-${Date.now()}`,
        classId: selectedClassId,
        tanggal: attDate,
        pertemuanKe,
        materiSingkat,
        entries,
      };
      updateState(
        (prev) => ({
          ...prev,
          attendanceSessions: [created, ...prev.attendanceSessions],
        }),
        'Absensi pertemuan berhasil disimpan'
      );
    }
  };

  const loadSessionToEdit = (session: AttendanceSession) => {
    setEditingSessionId(session.id);
    setSelectedClassId(session.classId);
    setAttDate(session.tanggal);
    setPertemuanKe(session.pertemuanKe);
    setMateriSingkat(session.materiSingkat);
    const nextMap: Record<string, { status: AttendanceStatus; keterangan: string }> = {};
    for (const e of session.entries) {
      nextMap[e.studentId] = { status: e.status, keterangan: e.keterangan ?? '' };
    }
    setEntryMap(nextMap);
  };

  const deleteSession = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        attendanceSessions: prev.attendanceSessions.filter((s) => s.id !== id),
      }),
      'Sesi absensi dihapus'
    );
  };

  // Journal State
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalFilterClass, setJournalFilterClass] = useState<string>('all');
  const [journalForm, setJournalForm] = useState<Omit<TeachingJournal, 'id'>>({
    tanggal: getTodayISO(),
    jamKe: '1–2 (07.00–08.30)',
    classId: selectedClassId || state.classes[0]?.id || '',
    tpKode: state.tpList[0]?.kode ?? 'E.3.1',
    materi: '',
    metode: 'Problem Based Learning & Latihan Terbimbing',
    hadirCount: classStudents.length,
    tidakHadirCount: 0,
    kejadianKhusus: 'Pembelajaran berjalan kondusif.',
    refleksi: '',
  });

  const filteredJournals = useMemo(
    () =>
      [...state.journals]
        .filter((j) => journalFilterClass === 'all' || j.classId === journalFilterClass)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [state.journals, journalFilterClass]
  );

  const openNewJournal = () => {
    const clsId = selectedClassId || state.classes[0]?.id || '';
    const count = state.students.filter((s) => s.classId === clsId).length;
    setJournalForm({
      tanggal: getTodayISO(),
      jamKe: '1–2 (07.00–08.30)',
      classId: clsId,
      tpKode: state.tpList[0]?.kode ?? 'E.3.1',
      materi: '',
      metode: 'Problem Based Learning & Diskusi Kelompok',
      hadirCount: count,
      tidakHadirCount: 0,
      kejadianKhusus: 'Tidak ada kejadian khusus, kelas kondusif.',
      refleksi: '',
    });
    setShowJournalForm(true);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.materi.trim()) return;
    const created: TeachingJournal = {
      id: `jrn-${Date.now()}`,
      ...journalForm,
    };
    updateState(
      (prev) => ({ ...prev, journals: [created, ...prev.journals] }),
      'Jurnal mengajar harian berhasil dicatat'
    );
    setShowJournalForm(false);
  };

  const deleteJournal = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        journals: prev.journals.filter((j) => j.id !== id),
      }),
      'Jurnal dihapus'
    );
  };

  const exportJournalsPdf = () => {
    const headers = [
      'Tanggal',
      'Kelas',
      'Jam Ke-',
      'TP',
      'Materi Diajarkan',
      'Hadir',
      'Refleksi',
    ];
    const rows = filteredJournals.map((j) => {
      const clsName =
        state.classes.find((c) => c.id === j.classId)?.namaKelas ?? '-';
      return [
        formatTanggalID(j.tanggal),
        clsName,
        j.jamKe,
        j.tpKode,
        j.materi,
        `${j.hadirCount} H / ${j.tidakHadirCount} TH`,
        j.refleksi || '-',
      ];
    });
    void exportTablePdf({
      fileName: 'Jurnal_Mengajar_Matematika_SMK_Garnesia.pdf',
      profile: state.profile,
      title: 'Jurnal Mengajar Harian Guru',
      metaLines: [
        `Guru Mata Pelajaran: ${state.profile.namaGuru} · Mapel: ${state.profile.mataPelajaran}`,
        `Tahun Ajaran: ${state.profile.tahunAjaran} · Semester ${state.profile.semester}`,
      ],
      headers,
      rows,
      landscape: true,
    });
  };

  const exportJournalsExcel = () => {
    const headers = [
      'Tanggal',
      'Kelas',
      'Jam Ke-',
      'Kode TP',
      'Materi Diajarkan',
      'Metode',
      'Hadir',
      'Tidak Hadir',
      'Kejadian Khusus',
      'Refleksi',
    ];
    const rows = filteredJournals.map((j) => {
      const clsName =
        state.classes.find((c) => c.id === j.classId)?.namaKelas ?? '-';
      return [
        j.tanggal,
        clsName,
        j.jamKe,
        j.tpKode,
        j.materi,
        j.metode,
        j.hadirCount,
        j.tidakHadirCount,
        j.kejadianKhusus,
        j.refleksi,
      ];
    });
    exportExcelSheet(
      'Jurnal_Mengajar_SMK_Garnesia.xlsx',
      'Jurnal Mengajar',
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Jurnal Mengajar &amp; Presensi Harian
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Checklist kehadiran siswa per pertemuan dan catatan refleksi pembelajaran
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('absensi')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'absensi'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Absensi Siswa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jurnal')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'jurnal'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Jurnal Harian Guru
          </button>
        </div>
      </div>

      {/* TAB 1: ABSENSI SISWA */}
      {activeTab === 'absensi' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Form Checklist */}
          <form
            onSubmit={handleSaveAttendance}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingSessionId ? 'Edit Presensi Pertemuan' : 'Input Presensi Pertemuan'}
              </h3>
              <button
                type="button"
                onClick={markAllPresent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                <CheckSquare className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Tandai Semua Hadir</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Pilih Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setEditingSessionId(null);
                    setSelectedClassId(e.target.value);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  {state.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.namaKelas}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tanggal Pertemuan
                </label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Pertemuan Ke-
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={pertemuanKe}
                  onChange={(e) => setPertemuanKe(Number(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Materi Singkat Pertemuan
                </label>
                <input
                  type="text"
                  required
                  value={materiSingkat}
                  onChange={(e) => setMateriSingkat(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-3 py-2.5 font-medium">Nama Siswa</th>
                    <th className="px-3 py-2.5 font-medium text-center">Status (H / S / I / A)</th>
                    <th className="px-3 py-2.5 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classStudents.map((st) => {
                    const current = entryMap[st.id] ?? { status: 'H', keterangan: '' };
                    return (
                      <tr key={st.id}>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {st.nama}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {st.nis}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() =>
                                  setEntryMap((prev) => ({
                                    ...prev,
                                    [st.id]: { ...current, status: code },
                                  }))
                                }
                                className={`h-8 w-8 rounded-md font-mono text-xs font-bold transition-colors ${
                                  current.status === code
                                    ? code === 'H'
                                      ? 'bg-teal-600 text-white'
                                      : code === 'S'
                                      ? 'bg-sky-600 text-white'
                                      : code === 'I'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-red-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                                }`}
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={current.keterangan}
                            onChange={(e) =>
                              setEntryMap((prev) => ({
                                ...prev,
                                [st.id]: { ...current, keterangan: e.target.value },
                              }))
                            }
                            placeholder="Opsional..."
                            className="w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              {editingSessionId && (
                <button
                  type="button"
                  onClick={() => setEditingSessionId(null)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                {editingSessionId ? 'Perbarui Presensi' : 'Simpan Presensi'}
              </button>
            </div>
          </form>

          {/* Right: Recap Percentage & History */}
          <div className="space-y-6 lg:col-span-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Rekap Kehadiran Siswa
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  {attendanceStats.percentage}%
                </span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="pb-2 font-medium">Nama</th>
                      <th className="pb-2 text-right font-medium">H</th>
                      <th className="pb-2 text-right font-medium">S</th>
                      <th className="pb-2 text-right font-medium">I</th>
                      <th className="pb-2 text-right font-medium">A</th>
                      <th className="pb-2 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attendanceStats.perStudent.map((row) => (
                      <tr key={row.student.id}>
                        <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                          {row.student.nama}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">{row.hadir}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{row.sakit}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{row.izin}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{row.alpa}</td>
                        <td className="py-2 text-right font-mono font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                          {row.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Riwayat Pertemuan Tersimpan
              </h3>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {classSessions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    Belum ada riwayat presensi untuk kelas ini.
                  </p>
                ) : (
                  classSessions.map((ses) => {
                    const hCount = ses.entries.filter((e) => e.status === 'H').length;
                    return (
                      <div key={ses.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            Pertemuan {ses.pertemuanKe} · {formatTanggalID(ses.tanggal)}
                          </div>
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {ses.materiSingkat}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                            Hadir {hCount}/{ses.entries.length} siswa
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => loadSessionToEdit(ses)}
                            className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSession(ses.id)}
                            className="rounded p-1 text-slate-400 hover:text-red-600"
                            aria-label="Hapus sesi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: JURNAL HARIAN GURU */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <select
              value={journalFilterClass}
              onChange={(e) => setJournalFilterClass(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">Semua Kelas ({state.journals.length} Jurnal)</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.namaKelas}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportJournalsExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ekspor Excel</span>
              </button>
              <button
                type="button"
                onClick={exportJournalsPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor PDF</span>
              </button>
              <button
                type="button"
                onClick={openNewJournal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Catat Jurnal Baru</span>
              </button>
            </div>
          </div>

          {showJournalForm && (
            <form
              onSubmit={handleSaveJournal}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Catat Jurnal Mengajar Harian
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={journalForm.tanggal}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, tanggal: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kelas
                  </label>
                  <select
                    value={journalForm.classId}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, classId: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {state.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Jam Ke-
                  </label>
                  <input
                    type="text"
                    value={journalForm.jamKe}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, jamKe: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kode TP Terkait
                  </label>
                  <select
                    value={journalForm.tpKode}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, tpKode: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {state.tpList.map((tp) => (
                      <option key={tp.id} value={tp.kode}>
                        {tp.kode} — {tp.materiPokok}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Materi yang Diajarkan
                  </label>
                  <input
                    type="text"
                    required
                    value={journalForm.materi}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, materi: e.target.value })
                    }
                    placeholder="Contoh: Aplikasi Logaritma pada Pertumbuhan Data"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Metode Pembelajaran
                  </label>
                  <input
                    type="text"
                    value={journalForm.metode}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, metode: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Siswa Hadir
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={journalForm.hadirCount}
                    onChange={(e) =>
                      setJournalForm({
                        ...journalForm,
                        hadirCount: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tidak Hadir
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={journalForm.tidakHadirCount}
                    onChange={(e) =>
                      setJournalForm({
                        ...journalForm,
                        tidakHadirCount: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Catatan Kejadian Khusus di Kelas
                  </label>
                  <input
                    type="text"
                    value={journalForm.kejadianKhusus}
                    onChange={(e) =>
                      setJournalForm({
                        ...journalForm,
                        kejadianKhusus: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Refleksi Pembelajaran
                  </label>
                  <textarea
                    rows={2}
                    value={journalForm.refleksi}
                    onChange={(e) =>
                      setJournalForm({ ...journalForm, refleksi: e.target.value })
                    }
                    placeholder="Evaluasi pemahaman siswa dan rencana tindak lanjut pertemuan berikutnya..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJournalForm(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {filteredJournals.map((j) => {
              const clsName =
                state.classes.find((c) => c.id === j.classId)?.namaKelas ?? '-';
              return (
                <article
                  key={j.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-teal-700 dark:text-teal-400">
                          {clsName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatTanggalID(j.tanggal)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Jam ke-{j.jamKe}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">TP {j.tpKode}</span>
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white">
                        {j.materi}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Metode: {j.metode} · Kehadiran: {j.hadirCount} Hadir, {j.tidakHadirCount} Tidak Hadir
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteJournal(j.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      aria-label="Hapus jurnal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800 sm:grid-cols-2">
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Kejadian Khusus
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                        {j.kejadianKhusus || '-'}
                      </p>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Refleksi Pembelajaran
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                        {j.refleksi || '-'}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
