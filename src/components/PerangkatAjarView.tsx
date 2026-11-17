import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import {
  FaseKurikulum,
  ModulAjar,
  SemesterType,
  TPStatus,
  TujuanPembelajaran,
} from '../types';
import {
  exportExcelSheet,
  exportModulAjarPdf,
  exportTablePdf,
} from '../utils/exporters';

type PerangkatTab = 'cp-tp-atp' | 'modul-ajar' | 'prota-promes';

const PANCASILA_OPTIONS = [
  'Beriman & Bertakwa',
  'Berkebinekaan Global',
  'Gotong Royong',
  'Mandiri',
  'Bernalar Kritis',
  'Kreatif',
];

const MONTHS_GANJIL = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_GENAP = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

export function PerangkatAjarView() {
  const { state, updateState } = useSimaguru();
  const [activeTab, setActiveTab] = useState<PerangkatTab>('cp-tp-atp');
  const [faseFilter, setFaseFilter] = useState<'Semua' | FaseKurikulum>('Semua');

  // TP Form
  const [showTPForm, setShowTPForm] = useState(false);
  const [editingTPId, setEditingTPId] = useState<string | null>(null);
  const [tpForm, setTPForm] = useState<{
    kode: string;
    fase: FaseKurikulum;
    semester: SemesterType;
    elemen: string;
    materiPokok: string;
    deskripsi: string;
    alokasiJP: number;
    status: TPStatus;
  }>({
    kode: '',
    fase: 'Fase E',
    semester: 'Ganjil',
    elemen: 'Bilangan',
    materiPokok: '',
    deskripsi: '',
    alokasiJP: 12,
    status: 'Belum',
  });

  // Modul Ajar Editor
  const [editingModulId, setEditingModulId] = useState<string | null>(null);
  const [showModulEditor, setShowModulEditor] = useState(false);
  const [modulForm, setModulForm] = useState<Omit<ModulAjar, 'id' | 'updatedAt'>>({
    judul: '',
    fase: 'Fase E',
    kelasTarget: 'X TKJ 1 & X RPL 1',
    semester: 'Ganjil',
    materiPokok: '',
    alokasiWaktu: '4 Pertemuan × 2 JP (8 JP)',
    kompetensiAwal: '',
    profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri'],
    saranaPrasarana: 'Papan tulis, proyektor LCD, LKPD cetak',
    targetPesertaDidik: 'Peserta didik reguler SMK',
    modelPembelajaran: 'Problem Based Learning (PBL)',
    tujuanPembelajaran: '',
    pemahamanBermakna: '',
    pertanyaanPemantik: '',
    kegiatanPendahuluan: '',
    kegiatanInti: '',
    kegiatanPenutup: '',
    asesmen: '',
    pengayaanRemedial: '',
    refleksi: '',
  });

  // Prota / Promes controls
  const [protaFase, setProtaFase] = useState<FaseKurikulum>('Fase E');
  const [promesSemester, setPromesSemester] = useState<SemesterType>(
    state.profile.semester
  );

  const filteredCP = useMemo(
    () =>
      state.cpList.filter(
        (cp) => faseFilter === 'Semua' || cp.fase === faseFilter
      ),
    [state.cpList, faseFilter]
  );

  const sortedTPs = useMemo(
    () =>
      [...state.tpList]
        .filter((tp) => faseFilter === 'Semua' || tp.fase === faseFilter)
        .sort((a, b) => a.urutan - b.urutan),
    [state.tpList, faseFilter]
  );

  const filteredModuls = useMemo(
    () =>
      state.modulList.filter(
        (m) => faseFilter === 'Semua' || m.fase === faseFilter
      ),
    [state.modulList, faseFilter]
  );

  const protaTPs = useMemo(
    () =>
      [...state.tpList]
        .filter((tp) => tp.fase === protaFase)
        .sort((a, b) => a.urutan - b.urutan),
    [state.tpList, protaFase]
  );

  const promesTPs = useMemo(
    () => protaTPs.filter((tp) => tp.semester === promesSemester),
    [protaTPs, promesSemester]
  );

  const activeMonths =
    promesSemester === 'Ganjil' ? MONTHS_GANJIL : MONTHS_GENAP;

  const openCreateTP = () => {
    setEditingTPId(null);
    setTPForm({
      kode: '',
      fase: faseFilter === 'Semua' ? 'Fase E' : faseFilter,
      semester: state.profile.semester,
      elemen: 'Bilangan',
      materiPokok: '',
      deskripsi: '',
      alokasiJP: 12,
      status: 'Belum',
    });
    setShowTPForm(true);
  };

  const openEditTP = (tp: TujuanPembelajaran) => {
    setEditingTPId(tp.id);
    setTPForm({
      kode: tp.kode,
      fase: tp.fase,
      semester: tp.semester,
      elemen: tp.elemen,
      materiPokok: tp.materiPokok,
      deskripsi: tp.deskripsi,
      alokasiJP: tp.alokasiJP,
      status: tp.status,
    });
    setShowTPForm(true);
  };

  const handleSaveTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpForm.kode.trim() || !tpForm.materiPokok.trim()) return;

    if (editingTPId) {
      updateState(
        (prev) => ({
          ...prev,
          tpList: prev.tpList.map((tp) =>
            tp.id === editingTPId ? { ...tp, ...tpForm } : tp
          ),
        }),
        'Tujuan Pembelajaran diperbarui'
      );
    } else {
      const nextOrder =
        state.tpList.reduce((max, t) => Math.max(max, t.urutan), 0) + 1;
      const created: TujuanPembelajaran = {
        id: `tp-${Date.now()}`,
        urutan: nextOrder,
        ...tpForm,
        bulanTarget: {},
      };
      updateState(
        (prev) => ({ ...prev, tpList: [...prev.tpList, created] }),
        'Tujuan Pembelajaran baru ditambahkan'
      );
    }
    setShowTPForm(false);
  };

  const moveTPOrder = (id: string, dir: -1 | 1) => {
    const ordered = [...state.tpList].sort((a, b) => a.urutan - b.urutan);
    const idx = ordered.findIndex((t) => t.id === id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= ordered.length) return;
    const temp = ordered[idx].urutan;
    ordered[idx] = { ...ordered[idx], urutan: ordered[targetIdx].urutan };
    ordered[targetIdx] = { ...ordered[targetIdx], urutan: temp };
    updateState((prev) => ({ ...prev, tpList: ordered }));
  };

  const cycleTPStatus = (tp: TujuanPembelajaran) => {
    const nextStatus: TPStatus =
      tp.status === 'Belum'
        ? 'Berjalan'
        : tp.status === 'Berjalan'
        ? 'Tercapai'
        : 'Belum';
    updateState((prev) => ({
      ...prev,
      tpList: prev.tpList.map((t) =>
        t.id === tp.id ? { ...t, status: nextStatus } : t
      ),
    }));
  };

  const deleteTP = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        tpList: prev.tpList.filter((t) => t.id !== id),
      }),
      'TP dihapus'
    );
  };

  const openCreateModul = () => {
    setEditingModulId(null);
    setModulForm({
      judul: '',
      fase: 'Fase E',
      kelasTarget: 'X TKJ 1 & X RPL 1',
      semester: state.profile.semester,
      materiPokok: '',
      alokasiWaktu: '4 Pertemuan × 2 JP (8 JP)',
      kompetensiAwal: '',
      profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri'],
      saranaPrasarana: 'Papan tulis, proyektor LCD, LKPD cetak',
      targetPesertaDidik: 'Peserta didik reguler SMK',
      modelPembelajaran: 'Problem Based Learning (PBL)',
      tujuanPembelajaran: '',
      pemahamanBermakna: '',
      pertanyaanPemantik: '',
      kegiatanPendahuluan: '1. Salam, doa, dan cek presensi.\n2. Apersepsi materi prasyarat.\n3. Penyampaian tujuan pembelajaran.',
      kegiatanInti: '1. Orientasi masalah kontekstual.\n2. Diskusi kelompok mengeksplorasi LKPD.\n3. Presentasi dan penguatan konsep.',
      kegiatanPenutup: '1. Kesimpulan bersama.\n2. Kuis formatif singkat.\n3. Refleksi dan doa penutup.',
      asesmen: 'Asesmen Formatif (LKPD & kuis) dan Asesmen Sumatif Lingkup Materi.',
      pengayaanRemedial: 'Pengayaan soal HOTS kontekstual; Remedial bimbingan konsep dasar.',
      refleksi: '',
    });
    setShowModulEditor(true);
  };

  const openEditModul = (mod: ModulAjar) => {
    setEditingModulId(mod.id);
    const { id: _id, updatedAt: _u, ...rest } = mod;
    setModulForm(rest);
    setShowModulEditor(true);
  };

  const handleSaveModul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modulForm.judul.trim() || !modulForm.materiPokok.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    if (editingModulId) {
      updateState(
        (prev) => ({
          ...prev,
          modulList: prev.modulList.map((m) =>
            m.id === editingModulId ? { ...m, ...modulForm, updatedAt: today } : m
          ),
        }),
        'Modul Ajar berhasil diperbarui'
      );
    } else {
      const created: ModulAjar = {
        id: `mod-${Date.now()}`,
        ...modulForm,
        updatedAt: today,
      };
      updateState(
        (prev) => ({ ...prev, modulList: [created, ...prev.modulList] }),
        'Modul Ajar baru berhasil disimpan'
      );
    }
    setShowModulEditor(false);
  };

  const deleteModul = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        modulList: prev.modulList.filter((m) => m.id !== id),
      }),
      'Modul Ajar dihapus'
    );
  };

  const updateMonthJP = (tpId: string, month: string, val: number) => {
    updateState((prev) => ({
      ...prev,
      tpList: prev.tpList.map((tp) =>
        tp.id === tpId
          ? {
              ...tp,
              bulanTarget: {
                ...tp.bulanTarget,
                [month]: Math.max(0, Math.min(30, val)),
              },
            }
          : tp
      ),
    }));
  };

  const exportPromesExcel = () => {
    const headers = [
      'Kode TP',
      'Elemen',
      'Materi Pokok',
      'Alokasi (JP)',
      ...activeMonths,
      'Total Terjadwal',
    ];
    const rows = promesTPs.map((tp) => {
      const monthVals = activeMonths.map((m) => tp.bulanTarget[m] ?? 0);
      const sum = monthVals.reduce((a, b) => a + b, 0);
      return [tp.kode, tp.elemen, tp.materiPokok, tp.alokasiJP, ...monthVals, sum];
    });
    exportExcelSheet(
      `Prota_Promes_${protaFase}_${promesSemester}_SMK_Garnesia.xlsx`,
      `Promes ${promesSemester}`,
      headers,
      rows,
      [
        ['PROGRAM SEMESTER (PROMES) KURIKULUM MERDEKA'],
        [`Sekolah: ${state.profile.instansi} | Mapel: ${state.profile.mataPelajaran} | Guru: ${state.profile.namaGuru}`],
        [`Fase: ${protaFase} | Semester: ${promesSemester} | Tahun Ajaran: ${state.profile.tahunAjaran}`],
      ]
    );
  };

  const exportPromesPdf = () => {
    const headers = [
      'Kode',
      'Materi Pokok',
      'JP',
      ...activeMonths,
      'Terjadwal',
    ];
    const rows = promesTPs.map((tp) => {
      const monthVals = activeMonths.map((m) => tp.bulanTarget[m] ?? 0);
      const sum = monthVals.reduce((a, b) => a + b, 0);
      return [tp.kode, tp.materiPokok, tp.alokasiJP, ...monthVals, sum];
    });
    void exportTablePdf({
      fileName: `Promes_${protaFase}_${promesSemester}_SMK_Garnesia.pdf`,
      profile: state.profile,
      title: `Program Semester (Promes) ${promesSemester}`,
      metaLines: [
        `Mata Pelajaran: ${state.profile.mataPelajaran} (${protaFase}) · Tahun Ajaran ${state.profile.tahunAjaran}`,
        `Guru Pengampu: ${state.profile.namaGuru}`,
      ],
      headers,
      rows,
      landscape: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Perangkat Ajar Kurikulum Merdeka
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pengelolaan CP, TP/ATP Matematika SMK, Modul Ajar RPP Plus, dan Prota/Promes
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'cp-tp-atp', label: 'CP, TP & ATP' },
              { id: 'modul-ajar', label: 'Modul Ajar / RPP+' },
              { id: 'prota-promes', label: 'Prota & Promes' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CP, TP & ATP */}
      {activeTab === 'cp-tp-atp' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              {(['Semua', 'Fase E', 'Fase F'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFaseFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    faseFilter === f
                      ? 'bg-slate-900 text-white dark:bg-teal-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openCreateTP}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah TP / ATP</span>
            </button>
          </div>

          {showTPForm && (
            <form
              onSubmit={handleSaveTP}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingTPId ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran (TP)'}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kode TP
                  </label>
                  <input
                    type="text"
                    required
                    value={tpForm.kode}
                    onChange={(e) => setTPForm({ ...tpForm, kode: e.target.value })}
                    placeholder="E.1.3"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Fase
                  </label>
                  <select
                    value={tpForm.fase}
                    onChange={(e) =>
                      setTPForm({ ...tpForm, fase: e.target.value as FaseKurikulum })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="Fase E">Fase E (Kelas X)</option>
                    <option value="Fase F">Fase F (Kelas XI &amp; XII)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Semester
                  </label>
                  <select
                    value={tpForm.semester}
                    onChange={(e) =>
                      setTPForm({ ...tpForm, semester: e.target.value as SemesterType })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Alokasi (JP)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={48}
                    value={tpForm.alokasiJP}
                    onChange={(e) =>
                      setTPForm({ ...tpForm, alokasiJP: Number(e.target.value) || 8 })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Elemen CP
                  </label>
                  <input
                    type="text"
                    required
                    value={tpForm.elemen}
                    onChange={(e) => setTPForm({ ...tpForm, elemen: e.target.value })}
                    placeholder="Bilangan / Aljabar / Geometri / Analisis Data"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Materi Pokok
                  </label>
                  <input
                    type="text"
                    required
                    value={tpForm.materiPokok}
                    onChange={(e) =>
                      setTPForm({ ...tpForm, materiPokok: e.target.value })
                    }
                    placeholder="Contoh: Persamaan Kuadrat & Fungsi Kuadrat"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Deskripsi Tujuan Pembelajaran
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['aᵐ', 'ᵃlog b', '√', '∑', 'π', 'θ', '≤', '≥', '∞'].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() =>
                            setTPForm({ ...tpForm, deskripsi: tpForm.deskripsi + sym })
                          }
                          className="rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={tpForm.deskripsi}
                    onChange={(e) =>
                      setTPForm({ ...tpForm, deskripsi: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTPForm(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Simpan TP
                </button>
              </div>
            </form>
          )}

          {/* Capaian Pembelajaran Reference Strip */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Capaian Pembelajaran (CP) Matematika SMK
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredCP.map((cp) => (
                <div
                  key={cp.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {cp.fase} · Elemen {cp.elemen}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {cp.deskripsi}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Alur Tujuan Pembelajaran (ATP) Table */}
          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Alur Tujuan Pembelajaran (ATP)
              </h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Urut</th>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Fase / Sem</th>
                  <th className="px-4 py-3 font-medium">Materi &amp; Tujuan Pembelajaran</th>
                  <th className="px-4 py-3 font-medium text-right">JP</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTPs.map((tp) => (
                  <tr key={tp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveTPOrder(tp.id, -1)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          aria-label="Naikkan urutan"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTPOrder(tp.id, 1)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          aria-label="Turunkan urutan"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {tp.kode}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tp.fase} · {tp.semester}
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tp.materiPokok}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        {tp.deskripsi}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                      {tp.alokasiJP}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => cycleTPStatus(tp)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          tp.status === 'Tercapai'
                            ? 'text-teal-700 dark:text-teal-400'
                            : tp.status === 'Berjalan'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                        title="Klik untuk ubah status"
                      >
                        {tp.status === 'Tercapai' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        <span>{tp.status}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditTP(tp)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        aria-label={`Edit ${tp.kode}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTP(tp.id)}
                        className="ml-1 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        aria-label={`Hapus ${tp.kode}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* TAB 2: Modul Ajar / RPP Plus */}
      {activeTab === 'modul-ajar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              {(['Semua', 'Fase E', 'Fase F'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFaseFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    faseFilter === f
                      ? 'bg-slate-900 text-white dark:bg-teal-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openCreateModul}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Modul Ajar</span>
            </button>
          </div>

          {showModulEditor && (
            <form
              onSubmit={handleSaveModul}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {editingModulId ? 'Edit Modul Ajar' : 'Generator Modul Ajar Kurikulum Merdeka'}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Judul Modul Ajar
                  </label>
                  <input
                    type="text"
                    required
                    value={modulForm.judul}
                    onChange={(e) => setModulForm({ ...modulForm, judul: e.target.value })}
                    placeholder="Contoh: Modul Ajar Matematika: Statistika Data Kelompok"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Fase &amp; Semester
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <select
                      value={modulForm.fase}
                      onChange={(e) =>
                        setModulForm({
                          ...modulForm,
                          fase: e.target.value as FaseKurikulum,
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="Fase E">Fase E</option>
                      <option value="Fase F">Fase F</option>
                    </select>
                    <select
                      value={modulForm.semester}
                      onChange={(e) =>
                        setModulForm({
                          ...modulForm,
                          semester: e.target.value as SemesterType,
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Materi Pokok
                  </label>
                  <input
                    type="text"
                    required
                    value={modulForm.materiPokok}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, materiPokok: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kelas Target
                  </label>
                  <input
                    type="text"
                    value={modulForm.kelasTarget}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, kelasTarget: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Alokasi Waktu
                  </label>
                  <input
                    type="text"
                    value={modulForm.alokasiWaktu}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, alokasiWaktu: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Model Pembelajaran
                  </label>
                  <input
                    type="text"
                    value={modulForm.modelPembelajaran}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        modelPembelajaran: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Target Peserta Didik
                  </label>
                  <input
                    type="text"
                    value={modulForm.targetPesertaDidik}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        targetPesertaDidik: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Sarana &amp; Prasarana
                  </label>
                  <input
                    type="text"
                    value={modulForm.saranaPrasarana}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, saranaPrasarana: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Dimensi Profil Pelajar Pancasila
                </label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {PANCASILA_OPTIONS.map((opt) => {
                    const checked = modulForm.profilPelajarPancasila.includes(opt);
                    return (
                      <label
                        key={opt}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? modulForm.profilPelajarPancasila.filter((x) => x !== opt)
                              : [...modulForm.profilPelajarPancasila, opt];
                            setModulForm({ ...modulForm, profilPelajarPancasila: next });
                          }}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kompetensi Awal
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.kompetensiAwal}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, kompetensiAwal: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tujuan Pembelajaran
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.tujuanPembelajaran}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        tujuanPembelajaran: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Pemahaman Bermakna
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.pemahamanBermakna}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        pemahamanBermakna: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Pertanyaan Pemantik
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.pertanyaanPemantik}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        pertanyaanPemantik: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kegiatan Pendahuluan
                  </label>
                  <textarea
                    rows={3}
                    value={modulForm.kegiatanPendahuluan}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        kegiatanPendahuluan: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kegiatan Inti
                  </label>
                  <textarea
                    rows={3}
                    value={modulForm.kegiatanInti}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, kegiatanInti: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kegiatan Penutup
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.kegiatanPenutup}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, kegiatanPenutup: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Asesmen (Formatif &amp; Sumatif)
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.asesmen}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, asesmen: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Pengayaan &amp; Remedial
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.pengayaanRemedial}
                    onChange={(e) =>
                      setModulForm({
                        ...modulForm,
                        pengayaanRemedial: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Refleksi Guru &amp; Peserta Didik
                  </label>
                  <textarea
                    rows={2}
                    value={modulForm.refleksi}
                    onChange={(e) =>
                      setModulForm({ ...modulForm, refleksi: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModulEditor(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Simpan Modul Ajar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredModuls.map((mod) => (
              <article
                key={mod.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
                    {mod.fase} · Semester {mod.semester} · {mod.kelasTarget}
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                    {mod.judul}
                  </h3>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {mod.modelPembelajaran} · {mod.alokasiWaktu}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {mod.tujuanPembelajaran}
                  </p>
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Profil Pancasila: {mod.profilPelajarPancasila.join(', ')}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-slate-800">
                  <span className="font-mono text-xs text-slate-400">
                    Diperbarui {mod.updatedAt}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModul(mod)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void exportModulAjarPdf(mod, state.profile);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Cetak PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteModul(mod.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      aria-label={`Hapus ${mod.judul}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Prota & Promes Otomatis */}
      {activeTab === 'prota-promes' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(['Fase E', 'Fase F'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setProtaFase(f)}
                    className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${
                      protaFase === f
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(['Ganjil', 'Genap'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPromesSemester(s)}
                    className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${
                      promesSemester === s
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Semester {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportPromesExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ekspor Excel</span>
              </button>
              <button
                type="button"
                onClick={exportPromesPdf}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor PDF</span>
              </button>
            </div>
          </div>

          {/* Program Semester Matrix */}
          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Program Semester ({promesSemester}) · {protaFase}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah alokasi JP per bulan langsung pada kolom bulan untuk menyusun jadwal distribusi materi
              </p>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Materi Pokok</th>
                  <th className="px-4 py-3 font-medium text-right">Target JP</th>
                  {activeMonths.map((m) => (
                    <th key={m} className="px-2 py-3 text-center font-medium">
                      {m}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Terjadwal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {promesTPs.map((tp) => {
                  const totalScheduled = activeMonths.reduce(
                    (acc, m) => acc + (tp.bulanTarget[m] ?? 0),
                    0
                  );
                  const balanced = totalScheduled === tp.alokasiJP;
                  return (
                    <tr key={tp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {tp.kode}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                        {tp.materiPokok}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums">
                        {tp.alokasiJP}
                      </td>
                      {activeMonths.map((m) => (
                        <td key={m} className="px-1.5 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={tp.bulanTarget[m] ?? 0}
                            onChange={(e) =>
                              updateMonthJP(tp.id, m, Number(e.target.value) || 0)
                            }
                            className="w-12 rounded border border-slate-200 bg-white px-1.5 py-1 text-center font-mono text-xs tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </td>
                      ))}
                      <td
                        className={`px-4 py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${
                          balanced
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {totalScheduled} JP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold dark:border-slate-800 dark:bg-slate-800/50">
                  <td colSpan={2} className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                    Total Alokasi Semester {promesSemester} ({protaFase})
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                    {promesTPs.reduce((a, b) => a + b.alokasiJP, 0)}
                  </td>
                  {activeMonths.map((m) => (
                    <td
                      key={m}
                      className="px-2 py-3 text-center font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300"
                    >
                      {promesTPs.reduce((a, b) => a + (b.bulanTarget[m] ?? 0), 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-teal-700 dark:text-teal-400">
                    {promesTPs.reduce(
                      (a, tp) =>
                        a +
                        activeMonths.reduce(
                          (s, m) => s + (tp.bulanTarget[m] ?? 0),
                          0
                        ),
                      0
                    )}{' '}
                    JP
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Program Tahunan Ringkasan */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ringkasan Program Tahunan (Prota) · {protaFase}
              </h3>
              <span className="font-mono text-xs font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                Total: {protaTPs.reduce((a, b) => a + b.alokasiJP, 0)} JP / Tahun
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['Ganjil', 'Genap'] as const).map((sem) => {
                const items = protaTPs.filter((t) => t.semester === sem);
                const sumJP = items.reduce((a, b) => a + b.alokasiJP, 0);
                return (
                  <div
                    key={sem}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Semester {sem}
                      </span>
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                        {sumJP} JP
                      </span>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs">
                      {items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
                        >
                          <span className="truncate">
                            <span className="font-mono font-semibold">{it.kode}</span> ·{' '}
                            {it.materiPokok}
                          </span>
                          <span className="font-mono tabular-nums shrink-0">
                            {it.alokasiJP} JP
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
