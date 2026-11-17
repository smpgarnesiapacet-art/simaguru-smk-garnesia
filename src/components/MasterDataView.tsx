import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import { ClassScheduleSlot, FaseKurikulum, SchoolClass, Student } from '../types';
import {
  downloadStudentImportTemplate,
  exportExcelSheet,
  parseStudentsFromSpreadsheet,
  SCHOOL_LOGO_PATH,
} from '../utils/exporters';

type MasterTab = 'profil' | 'kelas' | 'siswa';

export function MasterDataView() {
  const { state, updateState, notify } = useSimaguru();
  const [activeTab, setActiveTab] = useState<MasterTab>('profil');

  // Profile form state
  const [profileForm, setProfileForm] = useState(state.profile);

  // Class form state
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState<{
    namaKelas: string;
    tingkat: 'X' | 'XI' | 'XII';
    fase: FaseKurikulum;
    jurusan: string;
    waliKelas: string;
    jpPerMinggu: number;
    hari: ClassScheduleSlot['hari'];
    jamKe: string;
    waktu: string;
    ruang: string;
  }>({
    namaKelas: '',
    tingkat: 'X',
    fase: 'Fase E',
    jurusan: 'Teknik Komputer & Jaringan',
    waliKelas: '',
    jpPerMinggu: 4,
    hari: 'Senin',
    jamKe: '1–2',
    waktu: '07.00–08.30',
    ruang: 'R. Teori 01',
  });

  // Student management state
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id ?? 'all'
  );
  const [studentQuery, setStudentQuery] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<{
    classId: string;
    nis: string;
    nama: string;
    jenisKelamin: 'L' | 'P';
    kontakWali: string;
  }>({
    classId: state.classes[0]?.id ?? '',
    nis: '',
    nama: '',
    jenisKelamin: 'L',
    kontakWali: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return state.students.filter((st) => {
      const matchClass =
        selectedClassId === 'all' || st.classId === selectedClassId;
      const matchQuery =
        !q ||
        st.nama.toLowerCase().includes(q) ||
        st.nis.toLowerCase().includes(q) ||
        st.kontakWali.toLowerCase().includes(q);
      return matchClass && matchQuery;
    });
  }, [state.students, selectedClassId, studentQuery]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateState(
      (prev) => ({ ...prev, profile: profileForm }),
      'Profil Guru & Identitas Sekolah berhasil disimpan'
    );
  };

  const openCreateClass = () => {
    setEditingClassId(null);
    setClassForm({
      namaKelas: '',
      tingkat: 'X',
      fase: 'Fase E',
      jurusan: 'Teknik Komputer & Jaringan',
      waliKelas: '',
      jpPerMinggu: 4,
      hari: 'Senin',
      jamKe: '1–2',
      waktu: '07.00–08.30',
      ruang: 'R. Teori 01',
    });
    setShowClassForm(true);
  };

  const openEditClass = (cls: SchoolClass) => {
    const firstSlot = cls.jadwal[0] ?? {
      hari: 'Senin' as const,
      jamKe: '1–2',
      waktu: '07.00–08.30',
      ruang: 'R. Teori 01',
    };
    setEditingClassId(cls.id);
    setClassForm({
      namaKelas: cls.namaKelas,
      tingkat: cls.tingkat,
      fase: cls.fase,
      jurusan: cls.jurusan,
      waliKelas: cls.waliKelas,
      jpPerMinggu: cls.jpPerMinggu,
      hari: firstSlot.hari,
      jamKe: firstSlot.jamKe,
      waktu: firstSlot.waktu,
      ruang: firstSlot.ruang,
    });
    setShowClassForm(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.namaKelas.trim()) return;
    const newSlot: ClassScheduleSlot = {
      hari: classForm.hari,
      jamKe: classForm.jamKe,
      waktu: classForm.waktu,
      ruang: classForm.ruang,
    };

    if (editingClassId) {
      updateState(
        (prev) => ({
          ...prev,
          classes: prev.classes.map((c) =>
            c.id === editingClassId
              ? {
                  ...c,
                  namaKelas: classForm.namaKelas.trim(),
                  tingkat: classForm.tingkat,
                  fase: classForm.tingkat === 'X' ? 'Fase E' : 'Fase F',
                  jurusan: classForm.jurusan.trim(),
                  waliKelas: classForm.waliKelas.trim(),
                  jpPerMinggu: Number(classForm.jpPerMinggu) || 3,
                  jadwal: [newSlot, ...c.jadwal.slice(1)],
                }
              : c
          ),
        }),
        'Data kelas berhasil diperbarui'
      );
    } else {
      const created: SchoolClass = {
        id: `cls-${Date.now()}`,
        namaKelas: classForm.namaKelas.trim(),
        tingkat: classForm.tingkat,
        fase: classForm.tingkat === 'X' ? 'Fase E' : 'Fase F',
        jurusan: classForm.jurusan.trim(),
        waliKelas: classForm.waliKelas.trim() || '-',
        jpPerMinggu: Number(classForm.jpPerMinggu) || 3,
        jadwal: [newSlot],
      };
      updateState(
        (prev) => ({ ...prev, classes: [...prev.classes, created] }),
        'Kelas baru berhasil ditambahkan'
      );
    }
    setShowClassForm(false);
  };

  const handleDeleteClass = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
        students: prev.students.filter((s) => s.classId !== id),
      }),
      'Kelas berhasil dihapus'
    );
  };

  const openCreateStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      classId:
        selectedClassId === 'all'
          ? state.classes[0]?.id ?? ''
          : selectedClassId,
      nis: '',
      nama: '',
      jenisKelamin: 'L',
      kontakWali: '',
    });
    setShowStudentForm(true);
  };

  const openEditStudent = (st: Student) => {
    setEditingStudentId(st.id);
    setStudentForm({
      classId: st.classId,
      nis: st.nis,
      nama: st.nama,
      jenisKelamin: st.jenisKelamin,
      kontakWali: st.kontakWali,
    });
    setShowStudentForm(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nama.trim() || !studentForm.classId) return;
    if (editingStudentId) {
      updateState(
        (prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === editingStudentId
              ? {
                  ...s,
                  classId: studentForm.classId,
                  nis: studentForm.nis.trim(),
                  nama: studentForm.nama.trim(),
                  jenisKelamin: studentForm.jenisKelamin,
                  kontakWali: studentForm.kontakWali.trim() || '-',
                }
              : s
          ),
        }),
        'Data siswa berhasil diperbarui'
      );
    } else {
      const created: Student = {
        id: `std-${Date.now()}`,
        classId: studentForm.classId,
        nis: studentForm.nis.trim() || String(Date.now()).slice(-8),
        nama: studentForm.nama.trim(),
        jenisKelamin: studentForm.jenisKelamin,
        kontakWali: studentForm.kontakWali.trim() || '-',
      };
      updateState(
        (prev) => ({ ...prev, students: [...prev.students, created] }),
        'Siswa baru berhasil ditambahkan'
      );
    }
    setShowStudentForm(false);
  };

  const handleDeleteStudent = (id: string) => {
    updateState(
      (prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
      }),
      'Siswa dihapus'
    );
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetClass =
      selectedClassId === 'all' ? state.classes[0]?.id : selectedClassId;
    if (!targetClass) {
      notify('Pilih kelas tujuan terlebih dahulu', 'error');
      return;
    }
    try {
      const parsed = await parseStudentsFromSpreadsheet(file, targetClass);
      if (parsed.length === 0) {
        notify('Tidak ditemukan baris data siswa valid di berkas tersebut', 'error');
        return;
      }
      const newStudents: Student[] = parsed.map((p, idx) => ({
        ...p,
        id: `std-imp-${Date.now()}-${idx}`,
      }));
      updateState(
        (prev) => ({
          ...prev,
          students: [...prev.students, ...newStudents],
        }),
        `${newStudents.length} siswa berhasil diimpor dari Excel/CSV`
      );
    } catch {
      notify('Gagal membaca berkas Excel/CSV', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleExportStudents = () => {
    const headers = ['No', 'NIS', 'Nama Lengkap', 'L/P', 'Kelas', 'Kontak Orang Tua/Wali'];
    const rows = filteredStudents.map((st, idx) => {
      const clsName =
        state.classes.find((c) => c.id === st.classId)?.namaKelas ?? '-';
      return [idx + 1, st.nis, st.nama, st.jenisKelamin, clsName, st.kontakWali];
    });
    exportExcelSheet(
      `Data_Siswa_${state.profile.instansi.replace(/\s+/g, '_')}.xlsx`,
      'Data Siswa',
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Manajemen Data Master
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Identitas guru, rombongan belajar SMK, dan basis data siswa
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'profil', label: 'Profil Guru & Sekolah' },
              { id: 'kelas', label: 'Kelas & Jurusan SMK' },
              { id: 'siswa', label: 'Data Siswa & Import' },
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

      {/* TAB 1: Profil Guru & Sekolah */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleSaveProfile}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Identitas Guru &amp; Instansi
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nama Lengkap Guru
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.namaGuru}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, namaGuru: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.mataPelajaran}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      mataPelajaran: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  NIP Guru
                </label>
                <input
                  type="text"
                  value={profileForm.nipGuru}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, nipGuru: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  NUPTK
                </label>
                <input
                  type="text"
                  value={profileForm.nuptkGuru}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, nuptkGuru: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nama Instansi / Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.instansi}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, instansi: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  NPSN
                </label>
                <input
                  type="text"
                  value={profileForm.npsn}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, npsn: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={profileForm.alamatSekolah}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      alamatSekolah: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={profileForm.kepalaSekolah}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      kepalaSekolah: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={profileForm.nipKepalaSekolah}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      nipKepalaSekolah: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={profileForm.tahunAjaran}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      tahunAjaran: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Semester Aktif
                </label>
                <select
                  value={profileForm.semester}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      semester: e.target.value as 'Ganjil' | 'Genap',
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Kota/Kabupaten (Titimangsa)
                </label>
                <input
                  type="text"
                  value={profileForm.kota}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, kota: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  KKTP Default (0–100)
                </label>
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={profileForm.kktpDefault}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      kktpDefault: Number(e.target.value) || 75,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </form>

          {/* Live Kop Surat Preview */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pratinjau Kop Surat Resmi Dokumen
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Digunakan otomatis pada ekspor PDF Modul Ajar, Prota/Promes, dan Laporan
              </p>

              <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4 text-slate-900">
                <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                  <img
                    src={SCHOOL_LOGO_PATH}
                    alt="Logo SMK Garnesia"
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 shrink-0 object-contain"
                  />
                  <div className="flex-1 text-center">
                    <div className="text-[10px] font-bold tracking-wide text-slate-700">
                      PEMERINTAH PROVINSI JAWA BARAT · DINAS PENDIDIKAN
                    </div>
                    <div className="text-base font-bold tracking-tight text-slate-900">
                      {profileForm.instansi.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {profileForm.alamatSekolah} · NPSN: {profileForm.npsn}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {profileForm.teleponEmail}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 pt-4 text-[11px] text-slate-800">
                  <div>
                    <div>Mengetahui,</div>
                    <div>Kepala {profileForm.instansi}</div>
                    <div className="mt-8 font-bold underline">
                      {profileForm.kepalaSekolah}
                    </div>
                    <div className="font-mono text-[10px]">
                      NIP. {profileForm.nipKepalaSekolah}
                    </div>
                  </div>
                  <div>
                    <div>{profileForm.kota}, Tanggal Cetak</div>
                    <div>Guru Mata Pelajaran {profileForm.mataPelajaran}</div>
                    <div className="mt-8 font-bold underline">
                      {profileForm.namaGuru}
                    </div>
                    <div className="font-mono text-[10px]">
                      NIP. {profileForm.nipGuru}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kelas & Jurusan SMK */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Daftar rombongan belajar Fase E (Kelas X) dan Fase F (Kelas XI &amp; XII)
            </p>
            <button
              type="button"
              onClick={openCreateClass}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          {showClassForm && (
            <form
              onSubmit={handleSaveClass}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingClassId ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nama Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={classForm.namaKelas}
                    onChange={(e) =>
                      setClassForm({ ...classForm, namaKelas: e.target.value })
                    }
                    placeholder="Contoh: X TKJ 2"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tingkat &amp; Fase
                  </label>
                  <select
                    value={classForm.tingkat}
                    onChange={(e) => {
                      const t = e.target.value as 'X' | 'XI' | 'XII';
                      setClassForm({
                        ...classForm,
                        tingkat: t,
                        fase: t === 'X' ? 'Fase E' : 'Fase F',
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="X">Kelas X (Fase E)</option>
                    <option value="XI">Kelas XI (Fase F)</option>
                    <option value="XII">Kelas XII (Fase F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Jurusan / Kompetensi Keahlian
                  </label>
                  <input
                    type="text"
                    required
                    value={classForm.jurusan}
                    onChange={(e) =>
                      setClassForm({ ...classForm, jurusan: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Wali Kelas
                  </label>
                  <input
                    type="text"
                    value={classForm.waliKelas}
                    onChange={(e) =>
                      setClassForm({ ...classForm, waliKelas: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Alokasi JP / Minggu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={classForm.jpPerMinggu}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        jpPerMinggu: Number(e.target.value) || 3,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Hari Mengajar Utama
                  </label>
                  <select
                    value={classForm.hari}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        hari: e.target.value as ClassScheduleSlot['hari'],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Jam Ke-
                  </label>
                  <input
                    type="text"
                    value={classForm.jamKe}
                    onChange={(e) =>
                      setClassForm({ ...classForm, jamKe: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Waktu
                  </label>
                  <input
                    type="text"
                    value={classForm.waktu}
                    onChange={(e) =>
                      setClassForm({ ...classForm, waktu: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Ruang Kelas
                  </label>
                  <input
                    type="text"
                    value={classForm.ruang}
                    onChange={(e) =>
                      setClassForm({ ...classForm, ruang: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassForm(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Kelas</th>
                  <th className="px-4 py-3 font-medium">Fase</th>
                  <th className="px-4 py-3 font-medium">Kompetensi Keahlian</th>
                  <th className="px-4 py-3 font-medium">Wali Kelas</th>
                  <th className="px-4 py-3 font-medium">Jadwal Mengajar</th>
                  <th className="px-4 py-3 font-medium text-right">Siswa</th>
                  <th className="px-4 py-3 font-medium text-right">JP/Mg</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.classes.map((cls) => {
                  const count = state.students.filter((s) => s.classId === cls.id).length;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {cls.namaKelas}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {cls.fase}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {cls.jurusan}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {cls.waliKelas}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {cls.jadwal.map((j, i) => (
                          <div key={i} className="font-mono tabular-nums">
                            {j.hari}, {j.waktu} ({j.ruang})
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {count}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {cls.jpPerMinggu}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditClass(cls)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          aria-label={`Edit ${cls.namaKelas}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls.id)}
                          className="ml-1 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label={`Hapus ${cls.namaKelas}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Data Siswa & Import Excel */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="all">Semua Kelas ({state.students.length})</option>
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.namaKelas} ({state.students.filter((s) => s.classId === c.id).length})
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Cari NIS atau nama siswa..."
                  className="w-60 rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadStudentImportTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Template Excel</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <Upload className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Import Excel/CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportStudents}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={openCreateStudent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {showStudentForm && (
            <form
              onSubmit={handleSaveStudent}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingStudentId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kelas
                  </label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, classId: e.target.value })
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
                    NIS
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.nis}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, nis: e.target.value })
                    }
                    placeholder="26271008"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.nama}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, nama: e.target.value })
                    }
                    placeholder="Nama lengkap siswa"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Jenis Kelamin
                  </label>
                  <select
                    value={studentForm.jenisKelamin}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        jenisKelamin: e.target.value as 'L' | 'P',
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Kontak Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={studentForm.kontakWali}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, kontakWali: e.target.value })
                    }
                    placeholder="0812-xxxx-xxxx (Nama Orang Tua)"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentForm(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">NIS</th>
                  <th className="px-4 py-3 font-medium">Nama Siswa</th>
                  <th className="px-4 py-3 font-medium">L/P</th>
                  <th className="px-4 py-3 font-medium">Kelas</th>
                  <th className="px-4 py-3 font-medium">Kontak Orang Tua/Wali</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Tidak ada siswa yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const clsName =
                      state.classes.find((c) => c.id === st.classId)?.namaKelas ?? '-';
                    return (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                          {st.nis}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                          {st.nama}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {st.jenisKelamin}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {clsName}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {st.kontakWali}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditStudent(st)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            aria-label={`Edit ${st.nama}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st.id)}
                            className="ml-1 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            aria-label={`Hapus ${st.nama}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
