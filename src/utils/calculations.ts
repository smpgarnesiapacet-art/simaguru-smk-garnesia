import {
  AttendanceSession,
  GradeWeights,
  Student,
  StudentGrade,
} from '../types';

export function computeFinalScore(
  grade: Pick<StudentGrade, 'formatif' | 'sumatifLM' | 'sts' | 'sas'>,
  weights: GradeWeights
): number {
  const totalWeight =
    weights.formatif + weights.sumatifLM + weights.sts + weights.sas;
  if (totalWeight <= 0) return 0;
  const raw =
    (grade.formatif * weights.formatif +
      grade.sumatifLM * weights.sumatifLM +
      grade.sts * weights.sts +
      grade.sas * weights.sas) /
    totalWeight;
  return Math.round(raw * 10) / 10;
}

export function getPredikat(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function getTindakLanjut(
  score: number,
  kktp: number
): { label: 'Pengayaan' | 'Tuntas' | 'Remedial'; detail: string } {
  if (score >= 90) {
    return {
      label: 'Pengayaan',
      detail: 'Tuntas Optimal · Berikan tugas pengayaan HOTS / proyek terapan',
    };
  }
  if (score >= kktp) {
    return {
      label: 'Tuntas',
      detail: 'Memenuhi KKTP · Lanjut ke Tujuan Pembelajaran berikutnya',
    };
  }
  return {
    label: 'Remedial',
    detail: 'Belum Tuntas KKTP · Pembelajaran ulang terbimbing & uji ulang',
  };
}

export function getIndonesianDayName(date = new Date()): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export function formatTanggalID(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateAttendanceMetrics(
  sessions: AttendanceSession[],
  students: Student[],
  classId?: string
) {
  const relevantSessions = classId
    ? sessions.filter((s) => s.classId === classId)
    : sessions;
  let totalEntries = 0;
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  for (const session of relevantSessions) {
    for (const entry of session.entries) {
      totalEntries += 1;
      if (entry.status === 'H') hadir += 1;
      else if (entry.status === 'S') sakit += 1;
      else if (entry.status === 'I') izin += 1;
      else if (entry.status === 'A') alpa += 1;
    }
  }

  const percentage =
    totalEntries > 0 ? Math.round((hadir / totalEntries) * 1000) / 10 : 100;

  const perStudent = students
    .filter((st) => !classId || st.classId === classId)
    .map((student) => {
      let h = 0;
      let s = 0;
      let i = 0;
      let a = 0;
      for (const session of relevantSessions) {
        const found = session.entries.find((e) => e.studentId === student.id);
        if (found) {
          if (found.status === 'H') h += 1;
          else if (found.status === 'S') s += 1;
          else if (found.status === 'I') i += 1;
          else if (found.status === 'A') a += 1;
        }
      }
      const total = h + s + i + a;
      const pct = total > 0 ? Math.round((h / total) * 1000) / 10 : 100;
      return { student, hadir: h, sakit: s, izin: i, alpa: a, total, percentage: pct };
    });

  return { totalEntries, hadir, sakit, izin, alpa, percentage, perStudent };
}
