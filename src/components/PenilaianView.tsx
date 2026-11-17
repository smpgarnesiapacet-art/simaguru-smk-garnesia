import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import { SemesterType, StudentGrade } from '../types';
import {
  computeFinalScore,
  getPredikat,
  getTindakLanjut,
} from '../utils/calculations';
import { exportExcelSheet, exportTablePdf } from '../utils/exporters';

const MATH_SYMBOLS = [
  '√',
  '²',
  '³',
  'ⁿ',
  'ᵃlog ',
  '∑',
  'π',
  'θ',
  'α',
  'β',
  '≤',
  '≥',
  '≠',
  '∞',
  '∆',
  '→',
  '∈',
];

export function PenilaianView() {
  const { state, updateState } = useSimaguru();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id ?? ''
  );
  const [semester, setSemester] = useState<SemesterType>(state.profile.semester);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeights, setShowWeights] = useState(false);
  const [activeNoteStudentId, setActiveNoteStudentId] = useState<string | null>(
    null
  );

  const selectedClass = state.classes.find((c) => c.id === selectedClassId);

  const classStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.students.filter((st) => {
      if (st.classId !== selectedClassId) return false;
      if (!q) return true;
      return (
        st.nama.toLowerCase().includes(q) || st.nis.toLowerCase().includes(q)
      );
    });
  }, [state.students, selectedClassId, searchQuery]);

  const gradeRows = useMemo(() => {
    return classStudents.map((st) => {
      const existing = state.grades.find(
        (g) =>
          g.studentId === st.id &&
          g.classId === selectedClassId &&
          g.semester === semester
      );
      const record: StudentGrade = existing ?? {
        id: `grd-${st.id}-${semester}`,
        classId: selectedClassId,
        studentId: st.id,
        semester,
        formatif: 75,
        sumatifLM: 75,
        sts: 75,
        sas: 75,
        catatanMatematika: '',
      };
      const nilaiAkhir = computeFinalScore(record, state.gradeWeights);
      const predikat = getPredikat(nilaiAkhir);
      const tindak = getTindakLanjut(nilaiAkhir, state.gradeWeights.kktp);
      return { student: st, record, nilaiAkhir, predikat, tindak };
    });
  }, [classStudents, state.grades, selectedClassId, semester, state.gradeWeights]);

  const classStats = useMemo(() => {
    if (gradeRows.length === 0) {
      return { avg: 0, tuntasCount: 0, remedialCount: 0, pctTuntas: 0 };
    }
    const avg =
      Math.round(
        (gradeRows.reduce((a, b) => a + b.nilaiAkhir, 0) / gradeRows.length) * 10
      ) / 10;
    const tuntasCount = gradeRows.filter(
      (r) => r.nilaiAkhir >= state.gradeWeights.kktp
    ).length;
    const remedialCount = gradeRows.length - tuntasCount;
    const pctTuntas = Math.round((tuntasCount / gradeRows.length) * 100);
    return { avg, tuntasCount, remedialCount, pctTuntas };
  }, [gradeRows, state.gradeWeights.kktp]);

  const weightSum =
    state.gradeWeights.formatif +
    state.gradeWeights.sumatifLM +
    state.gradeWeights.sts +
    state.gradeWeights.sas;

  const updateGradeField = (
    studentId: string,
    field: 'formatif' | 'sumatifLM' | 'sts' | 'sas' | 'catatanMatematika',
    value: number | string
  ) => {
    updateState((prev) => {
      const idx = prev.grades.findIndex(
        (g) =>
          g.studentId === studentId &&
          g.classId === selectedClassId &&
          g.semester === semester
      );
      const safeVal =
        typeof value === 'number' ? Math.max(0, Math.min(100, value)) : value;

      if (idx >= 0) {
        const nextGrades = [...prev.grades];
        nextGrades[idx] = { ...nextGrades[idx], [field]: safeVal };
        return { ...prev, grades: nextGrades };
      }
      const created: StudentGrade = {
        id: `grd-${Date.now()}-${studentId}`,
        classId: selectedClassId,
        studentId,
        semester,
        formatif: 75,
        sumatifLM: 75,
        sts: 75,
        sas: 75,
        catatanMatematika: '',
        [field]: safeVal,
      };
      return { ...prev, grades: [...prev.grades, created] };
    });
  };

  const insertMathSymbol = (symbol: string) => {
    const targetId = activeNoteStudentId ?? gradeRows[0]?.student.id;
    if (!targetId) return;
    const targetRow = gradeRows.find((r) => r.student.id === targetId);
    const currentText = targetRow?.record.catatanMatematika ?? '';
    updateGradeField(targetId, 'catatanMatematika', `${currentText}${symbol}`);
  };

  const updateWeight = (
    key: 'formatif' | 'sumatifLM' | 'sts' | 'sas' | 'kktp',
    val: number
  ) => {
    updateState((prev) => ({
      ...prev,
      gradeWeights: {
        ...prev.gradeWeights,
        [key]: Math.max(0, Math.min(100, val)),
      },
    }));
  };

  const handleExportExcel = () => {
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Formatif',
      'Sumatif LM',
      'STS',
      'SAS',
      'Nilai Akhir',
      'Predikat',
      'Status KKTP',
      'Rekomendasi Tindak Lanjut',
      'Catatan Matematika',
    ];
    const rows = gradeRows.map((r, i) => [
      i + 1,
      r.student.nis,
      r.student.nama,
      r.record.formatif,
      r.record.sumatifLM,
      r.record.sts,
      r.record.sas,
      r.nilaiAkhir,
      r.predikat,
      r.nilaiAkhir >= state.gradeWeights.kktp ? 'Tuntas' : 'Belum Tuntas',
      r.tindak.label,
      r.record.catatanMatematika || '-',
    ]);
    exportExcelSheet(
      `Buku_Nilai_${selectedClass?.namaKelas ?? 'Kelas'}_${semester}.xlsx`,
      `Nilai ${selectedClass?.namaKelas ?? ''}`,
      headers,
      rows,
      [
        [`BUKU NILAI DIGITAL · ${state.profile.instansi.toUpperCase()}`],
        [`Mata Pelajaran: ${state.profile.mataPelajaran} | Kelas: ${selectedClass?.namaKelas ?? '-'} | Semester: ${semester}`],
        [`Guru: ${state.profile.namaGuru} | KKTP: ${state.gradeWeights.kktp}`],
      ]
    );
  };

  const handleExportPdf = () => {
    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Frm',
      'SLM',
      'STS',
      'SAS',
      'Akhir',
      'Pred',
      'Tindak Lanjut',
    ];
    const rows = gradeRows.map((r, i) => [
      i + 1,
      r.student.nis,
      r.student.nama,
      r.record.formatif,
      r.record.sumatifLM,
      r.record.sts,
      r.record.sas,
      r.nilaiAkhir,
      r.predikat,
      r.tindak.label,
    ]);
    void exportTablePdf({
      fileName: `Buku_Nilai_${selectedClass?.namaKelas ?? 'Kelas'}_${semester}.pdf`,
      profile: state.profile,
      title: `Daftar Nilai & Ketuntasan KKTP · Kelas ${selectedClass?.namaKelas ?? ''}`,
      metaLines: [
        `Mata Pelajaran: ${state.profile.mataPelajaran} (${selectedClass?.fase ?? ''}) · Semester ${semester} TA ${state.profile.tahunAjaran}`,
        `Bobot: Formatif ${state.gradeWeights.formatif}% · Sumatif LM ${state.gradeWeights.sumatifLM}% · STS ${state.gradeWeights.sts}% · SAS ${state.gradeWeights.sas}% · KKTP ${state.gradeWeights.kktp}`,
      ],
      headers,
      rows,
      landscape: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Penilaian &amp; Asesmen Digital
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Buku nilai formatif &amp; sumatif Kurikulum Merdeka lengkap dengan kalkulasi KKTP otomatis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWeights((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Atur Bobot &amp; KKTP</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Weight Configuration Panel */}
      {showWeights && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Konfigurasi Bobot Nilai &amp; KKTP
            </h3>
            <span
              className={`font-mono text-xs font-semibold ${
                weightSum === 100
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              Total Bobot: {weightSum}% {weightSum !== 100 ? '(Idealnya 100%)' : ''}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Formatif / Tugas (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={state.gradeWeights.formatif}
                onChange={(e) => updateWeight('formatif', Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Sumatif Lingkup Materi (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={state.gradeWeights.sumatifLM}
                onChange={(e) =>
                  updateWeight('sumatifLM', Number(e.target.value) || 0)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Sumatif Tengah Sem. (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={state.gradeWeights.sts}
                onChange={(e) => updateWeight('sts', Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Sumatif Akhir Sem. (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={state.gradeWeights.sas}
                onChange={(e) => updateWeight('sas', Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ambang KKTP
              </label>
              <input
                type="number"
                min={50}
                max={95}
                value={state.gradeWeights.kktp}
                onChange={(e) => updateWeight('kktp', Number(e.target.value) || 75)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold text-teal-700 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-400"
              />
            </div>
          </div>
        </section>
      )}

      {/* Filter & Summary Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
          >
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namaKelas} ({c.fase})
              </option>
            ))}
          </select>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as SemesterType)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Rata-rata Kelas
            </div>
            <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {classStats.avg}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Tuntas KKTP (≥{state.gradeWeights.kktp})
            </div>
            <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-teal-600 dark:text-teal-400">
              {classStats.tuntasCount} ({classStats.pctTuntas}%)
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Perlu Remedial
            </div>
            <div className="mt-0.5 font-mono text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {classStats.remedialCount} siswa
            </div>
          </div>
        </div>
      </div>

      {/* Math Symbol Quick Insert Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Sisipkan Simbol Matematika ke Kolom Catatan:
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {MATH_SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => insertMathSymbol(sym)}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-slate-800 hover:border-teal-500 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {sym.trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Digital Gradebook Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-3 py-3 font-medium">Siswa</th>
              <th className="px-2 py-3 text-center font-medium">
                Formatif ({state.gradeWeights.formatif}%)
              </th>
              <th className="px-2 py-3 text-center font-medium">
                Sumatif LM ({state.gradeWeights.sumatifLM}%)
              </th>
              <th className="px-2 py-3 text-center font-medium">
                STS ({state.gradeWeights.sts}%)
              </th>
              <th className="px-2 py-3 text-center font-medium">
                SAS ({state.gradeWeights.sas}%)
              </th>
              <th className="px-3 py-3 text-right font-medium">Akhir</th>
              <th className="px-2 py-3 text-center font-medium">Pred</th>
              <th className="px-3 py-3 font-medium">Status &amp; Tindak Lanjut</th>
              <th className="px-3 py-3 font-medium">Catatan Soal / Matematika</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {gradeRows.map(({ student, record, nilaiAkhir, predikat, tindak }) => {
              const isTuntas = nilaiAkhir >= state.gradeWeights.kktp;
              return (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 min-w-[170px]">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {student.nama}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {student.nis}
                    </div>
                  </td>
                  {(['formatif', 'sumatifLM', 'sts', 'sas'] as const).map((field) => (
                    <td key={field} className="px-1.5 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={record[field]}
                        onChange={(e) =>
                          updateGradeField(
                            student.id,
                            field,
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-14 rounded-md border border-slate-200 bg-white px-1.5 py-1.5 text-center font-mono text-xs tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {nilaiAkhir.toFixed(1)}
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {predikat}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        tindak.label === 'Pengayaan'
                          ? 'text-teal-700 dark:text-teal-400'
                          : isTuntas
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {tindak.label === 'Pengayaan' ? (
                        <Award className="h-3.5 w-3.5 shrink-0" />
                      ) : isTuntas ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>{tindak.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 min-w-[240px]">
                    <input
                      type="text"
                      value={record.catatanMatematika}
                      onFocus={() => setActiveNoteStudentId(student.id)}
                      onChange={(e) =>
                        updateGradeField(
                          student.id,
                          'catatanMatematika',
                          e.target.value
                        )
                      }
                      placeholder="Catatan kompetensi / rumus..."
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
