import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import { AgendaItem } from '../types';
import {
  calculateAttendanceMetrics,
  formatTanggalID,
  getIndonesianDayName,
  getTodayISO,
} from '../utils/calculations';
import { NavSection } from './LayoutShell';

interface DashboardViewProps {
  onNavigate: (section: NavSection, preselectClassId?: string) => void;
}

const WEEKDAYS: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat')[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { state, updateState } = useSimaguru();
  const todayDayName = getIndonesianDayName();
  const defaultDay = WEEKDAYS.includes(todayDayName as (typeof WEEKDAYS)[number])
    ? (todayDayName as (typeof WEEKDAYS)[number])
    : 'Selasa';
  const [selectedDay, setSelectedDay] =
    useState<(typeof WEEKDAYS)[number]>(defaultDay);

  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [newAgenda, setNewAgenda] = useState<{
    judul: string;
    tanggal: string;
    kategori: AgendaItem['kategori'];
    catatan: string;
  }>({
    judul: '',
    tanggal: getTodayISO(),
    kategori: 'Asesmen',
    catatan: '',
  });

  const attendanceSummary = useMemo(
    () => calculateAttendanceMetrics(state.attendanceSessions, state.students),
    [state.attendanceSessions, state.students]
  );

  const tpProgress = useMemo(() => {
    const activeSemesterTPs = state.tpList.filter(
      (tp) => tp.semester === state.profile.semester
    );
    const total = activeSemesterTPs.length || 1;
    const tercapai = activeSemesterTPs.filter((tp) => tp.status === 'Tercapai').length;
    const berjalan = activeSemesterTPs.filter((tp) => tp.status === 'Berjalan').length;
    const pct = Math.round(((tercapai + berjalan * 0.5) / total) * 100);
    return {
      total: activeSemesterTPs.length,
      tercapai,
      berjalan,
      pct,
    };
  }, [state.tpList, state.profile.semester]);

  const scheduleForSelectedDay = useMemo(() => {
    const items: {
      classId: string;
      namaKelas: string;
      fase: string;
      jurusan: string;
      jamKe: string;
      waktu: string;
      ruang: string;
    }[] = [];

    for (const cls of state.classes) {
      for (const slot of cls.jadwal) {
        if (slot.hari === selectedDay) {
          items.push({
            classId: cls.id,
            namaKelas: cls.namaKelas,
            fase: cls.fase,
            jurusan: cls.jurusan,
            jamKe: slot.jamKe,
            waktu: slot.waktu,
            ruang: slot.ruang,
          });
        }
      }
    }
    return items.sort((a, b) => a.waktu.localeCompare(b.waktu));
  }, [state.classes, selectedDay]);

  const sortedAgendas = useMemo(
    () => [...state.agendas].sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    [state.agendas]
  );

  const maleCount = state.students.filter((s) => s.jenisKelamin === 'L').length;
  const femaleCount = state.students.filter((s) => s.jenisKelamin === 'P').length;

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.judul.trim()) return;
    const item: AgendaItem = {
      id: `agd-${Date.now()}`,
      judul: newAgenda.judul.trim(),
      tanggal: newAgenda.tanggal || getTodayISO(),
      kategori: newAgenda.kategori,
      catatan: newAgenda.catatan.trim() || '-',
      selesai: false,
    };
    updateState(
      (prev) => ({ ...prev, agendas: [...prev.agendas, item] }),
      'Agenda akademik berhasil ditambahkan'
    );
    setNewAgenda({
      judul: '',
      tanggal: getTodayISO(),
      kategori: 'Asesmen',
      catatan: '',
    });
    setShowAgendaForm(false);
  };

  const toggleAgendaDone = (id: string) => {
    updateState((prev) => ({
      ...prev,
      agendas: prev.agendas.map((a) =>
        a.id === id ? { ...a, selesai: !a.selesai } : a
      ),
    }));
  };

  const removeAgenda = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        agendas: prev.agendas.filter((a) => a.id !== id),
      }),
      'Agenda dihapus'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
            {todayDayName}, {formatTanggalID(getTodayISO())} · {state.profile.kurikulum}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Selamat bertugas, {state.profile.namaGuru}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Mata Pelajaran {state.profile.mataPelajaran} · {state.profile.instansi} · Semester {state.profile.semester} {state.profile.tahunAjaran}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('jurnal')}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 whitespace-nowrap"
          >
            Input Jurnal & Absensi
          </button>
          <button
            type="button"
            onClick={() => onNavigate('penilaian')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Buka Buku Nilai
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Kelas Diajar
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {state.classes.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Fase E &amp; Fase F
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {state.classes.reduce((acc, c) => acc + c.jpPerMinggu, 0)} JP total / minggu
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Jumlah Siswa Aktif
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {state.students.length}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {maleCount} L · {femaleCount} P
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tersebar di {state.classes.length} rombongan belajar
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Kehadiran Siswa Bulan Ini
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {attendanceSummary.percentage}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {attendanceSummary.hadir}/{attendanceSummary.totalEntries} sesi
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Sakit {attendanceSummary.sakit} · Izin {attendanceSummary.izin} · Alpa {attendanceSummary.alpa}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ketercapaian Materi (TP/ATP)
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {tpProgress.pct}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {tpProgress.tercapai}/{tpProgress.total} TP tuntas
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-teal-600 transition-all"
              style={{ width: `${Math.min(tpProgress.pct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Jadwal Mengajar Hari Ini + Progres Kelas */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Jadwal Mengajar Harian
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Klik kelas untuk langsung mengisi absensi &amp; jurnal pertemuan
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedDay === day
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {scheduleForSelectedDay.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak ada jadwal tatap muka pada hari {selectedDay}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {scheduleForSelectedDay.map((slot, idx) => (
                  <div
                    key={`${slot.classId}-${idx}`}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {slot.namaKelas}
                        </span>
                        <span className="text-xs text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {slot.fase}
                        </span>
                        <span className="text-xs text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="truncate text-xs text-slate-600 dark:text-slate-400">
                          {slot.jurusan}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          Jam ke-{slot.jamKe} ({slot.waktu})
                        </span>
                        <span>·</span>
                        <span className="font-sans">{slot.ruang}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('jurnal', slot.classId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-300 whitespace-nowrap shrink-0"
                    >
                      <span>Catat Absensi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ketercapaian Materi & Kehadiran per Kelas */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Ringkasan Kehadiran &amp; Progres Kelas
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('perangkat')}
                className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400 whitespace-nowrap"
              >
                Kelola TP/ATP
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="pb-2.5 font-medium">Kelas</th>
                    <th className="pb-2.5 font-medium">Fase</th>
                    <th className="pb-2.5 font-medium text-right">Siswa</th>
                    <th className="pb-2.5 font-medium text-right">JP/Mg</th>
                    <th className="pb-2.5 font-medium text-right">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.classes.map((cls) => {
                    const clsStudents = state.students.filter((s) => s.classId === cls.id);
                    const clsAtt = calculateAttendanceMetrics(
                      state.attendanceSessions,
                      state.students,
                      cls.id
                    );
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                          {cls.namaKelas}
                        </td>
                        <td className="py-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {cls.fase}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                          {clsStudents.length}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                          {cls.jpPerMinggu}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                          {clsAtt.percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right: Kalender Akademik & Pengingat Agenda */}
        <div className="lg:col-span-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Kalender Akademik &amp; Agenda
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pengingat deadline penilaian, rapat, dan supervisi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAgendaForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {showAgendaForm && (
              <form
                onSubmit={handleAddAgenda}
                className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Judul Agenda / Pengingat
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgenda.judul}
                    onChange={(e) => setNewAgenda({ ...newAgenda, judul: e.target.value })}
                    placeholder="Contoh: Input Nilai SAS Kelas X"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={newAgenda.tanggal}
                      onChange={(e) => setNewAgenda({ ...newAgenda, tanggal: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Kategori
                    </label>
                    <select
                      value={newAgenda.kategori}
                      onChange={(e) =>
                        setNewAgenda({
                          ...newAgenda,
                          kategori: e.target.value as AgendaItem['kategori'],
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Asesmen">Asesmen</option>
                      <option value="Rapat">Rapat</option>
                      <option value="Supervisi">Supervisi</option>
                      <option value="Administrasi">Administrasi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Catatan Singkat
                  </label>
                  <input
                    type="text"
                    value={newAgenda.catatan}
                    onChange={(e) => setNewAgenda({ ...newAgenda, catatan: e.target.value })}
                    placeholder="Keterangan tambahan..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAgendaForm(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Simpan Agenda
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {sortedAgendas.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Belum ada agenda akademik tercatat.
                </p>
              ) : (
                sortedAgendas.map((agenda) => (
                  <div key={agenda.id} className="flex items-start justify-between gap-3 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleAgendaDone(agenda.id)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                      aria-label={agenda.selesai ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          agenda.selesai
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium ${
                          agenda.selesai
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {agenda.judul}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="h-3 w-3" />
                          {formatTanggalID(agenda.tanggal)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{agenda.kategori}</span>
                      </div>
                      {agenda.catatan && agenda.catatan !== '-' && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {agenda.catatan}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAgenda(agenda.id)}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      aria-label="Hapus agenda"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
