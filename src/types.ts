export type FaseKurikulum = 'Fase E' | 'Fase F';
export type SemesterType = 'Ganjil' | 'Genap';
export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';
export type TPStatus = 'Belum' | 'Berjalan' | 'Tercapai';

export interface TeacherSchoolProfile {
  namaGuru: string;
  nipGuru: string;
  nuptkGuru: string;
  mataPelajaran: string;
  instansi: string;
  npsn: string;
  alamatSekolah: string;
  teleponEmail: string;
  kota: string;
  tahunAjaran: string;
  semester: SemesterType;
  kurikulum: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kktpDefault: number;
  logoDinasDataUrl?: string;
  logoSekolahDataUrl?: string;
}

export interface ClassScheduleSlot {
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  jamKe: string;
  waktu: string;
  ruang: string;
}

export interface SchoolClass {
  id: string;
  namaKelas: string;
  tingkat: 'X' | 'XI' | 'XII';
  fase: FaseKurikulum;
  jurusan: string;
  waliKelas: string;
  jpPerMinggu: number;
  jadwal: ClassScheduleSlot[];
}

export interface Student {
  id: string;
  classId: string;
  nis: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  kontakWali: string;
}

export interface AgendaItem {
  id: string;
  judul: string;
  tanggal: string;
  kategori: 'Asesmen' | 'Rapat' | 'Supervisi' | 'Administrasi';
  catatan: string;
  selesai: boolean;
}

export interface CapaianPembelajaran {
  id: string;
  fase: FaseKurikulum;
  elemen: string;
  deskripsi: string;
}

export interface TujuanPembelajaran {
  id: string;
  urutan: number;
  kode: string;
  fase: FaseKurikulum;
  semester: SemesterType;
  elemen: string;
  materiPokok: string;
  deskripsi: string;
  alokasiJP: number;
  status: TPStatus;
  bulanTarget: Record<string, number>;
}

export interface ModulAjar {
  id: string;
  judul: string;
  fase: FaseKurikulum;
  kelasTarget: string;
  semester: SemesterType;
  materiPokok: string;
  alokasiWaktu: string;
  kompetensiAwal: string;
  profilPelajarPancasila: string[];
  saranaPrasarana: string;
  targetPesertaDidik: string;
  modelPembelajaran: string;
  tujuanPembelajaran: string;
  pemahamanBermakna: string;
  pertanyaanPemantik: string;
  kegiatanPendahuluan: string;
  kegiatanInti: string;
  kegiatanPenutup: string;
  asesmen: string;
  pengayaanRemedial: string;
  refleksi: string;
  updatedAt: string;
}

export interface StudentAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  keterangan?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  tanggal: string;
  pertemuanKe: number;
  materiSingkat: string;
  entries: StudentAttendanceEntry[];
}

export interface TeachingJournal {
  id: string;
  tanggal: string;
  jamKe: string;
  classId: string;
  tpKode: string;
  materi: string;
  metode: string;
  hadirCount: number;
  tidakHadirCount: number;
  kejadianKhusus: string;
  refleksi: string;
}

export interface GradeWeights {
  formatif: number;
  sumatifLM: number;
  sts: number;
  sas: number;
  kktp: number;
}

export interface StudentGrade {
  id: string;
  classId: string;
  studentId: string;
  semester: SemesterType;
  formatif: number;
  sumatifLM: number;
  sts: number;
  sas: number;
  catatanMatematika: string;
}

export interface SimaguruState {
  profile: TeacherSchoolProfile;
  classes: SchoolClass[];
  students: Student[];
  agendas: AgendaItem[];
  cpList: CapaianPembelajaran[];
  tpList: TujuanPembelajaran[];
  modulList: ModulAjar[];
  attendanceSessions: AttendanceSession[];
  journals: TeachingJournal[];
  gradeWeights: GradeWeights;
  grades: StudentGrade[];
}
