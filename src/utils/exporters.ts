import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ModulAjar, Student, TeacherSchoolProfile } from '../types';
import { formatTanggalID, getTodayISO } from './calculations';

export const SCHOOL_LOGO_PATH = '/src/assets/images/logo_smk_garnesia_1794907012347.jpg';
export const TEACHER_AVATAR_PATH = '/src/assets/images/avatar_wendi_supriadi_1794907014220.jpg';

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function exportExcelSheet(
  fileName: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
  metaLines: string[][] = []
) {
  const aoa: (string | number)[][] = [
    ...metaLines,
    ...(metaLines.length > 0 ? [[]] : []),
    headers,
    ...rows,
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const colWidths = headers.map((h, idx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[idx] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 46) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

export function downloadStudentImportTemplate() {
  const headers = ['NIS', 'Nama Lengkap', 'Jenis Kelamin (L/P)', 'Kontak Orang Tua/Wali'];
  const sampleRows = [
    ['26271099', 'Budi Santoso', 'L', '0812-3456-7890 (Bp. Slamet)'],
    ['26271100', 'Siti Aminah', 'P', '0813-9876-5432 (Ibu Wati)'],
  ];
  exportExcelSheet('Template_Import_Siswa_SMK_Garnesia.xlsx', 'Data Siswa', headers, sampleRows);
}

export async function parseStudentsFromSpreadsheet(
  file: File,
  targetClassId: string
): Promise<Omit<Student, 'id'>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });

  const parsed: Omit<Student, 'id'>[] = [];
  for (const row of rows) {
    const keys = Object.keys(row);
    const getVal = (candidates: string[]) => {
      const matchedKey = keys.find((k) =>
        candidates.some((c) => k.toLowerCase().includes(c))
      );
      return matchedKey ? String(row[matchedKey] ?? '').trim() : '';
    };

    const nis = getVal(['nis', 'induk']);
    const nama = getVal(['nama']);
    const jkRaw = getVal(['kelamin', 'jk', 'gender', 'l/p']).toUpperCase();
    const kontak = getVal(['kontak', 'hp', 'telp', 'wali', 'ortu']);

    if (!nama) continue;
    const jenisKelamin: 'L' | 'P' = jkRaw.startsWith('P') ? 'P' : 'L';
    parsed.push({
      classId: targetClassId,
      nis: nis || String(Math.floor(26270000 + Math.random() * 9000)),
      nama,
      jenisKelamin,
      kontakWali: kontak || '-',
    });
  }
  return parsed;
}

async function drawKopSuratAndFooter(
  doc: jsPDF,
  profile: TeacherSchoolProfile,
  documentTitle: string,
  subtitleLines: string[]
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoData = await loadImageAsDataUrl(SCHOOL_LOGO_PATH);

  if (logoData) {
    doc.addImage(logoData, 'JPEG', 14, 10, 20, 20);
  }

  const centerX = pageWidth / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH PROVINSI JAWA BARAT · DINAS PENDIDIKAN', centerX, 14, { align: 'center' });
  doc.setFontSize(14);
  doc.text(profile.instansi.toUpperCase(), centerX, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${profile.alamatSekolah} · NPSN: ${profile.npsn}`, centerX, 25, { align: 'center' });
  doc.text(profile.teleponEmail, centerX, 29, { align: 'center' });

  doc.setLineWidth(0.8);
  doc.line(14, 33, pageWidth - 14, 33);
  doc.setLineWidth(0.3);
  doc.line(14, 34.3, pageWidth - 14, 34.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(documentTitle.toUpperCase(), pageWidth / 2, 42, { align: 'center' });

  let cursorY = 48;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const line of subtitleLines) {
    doc.text(line, 14, cursorY);
    cursorY += 4.5;
  }
  return cursorY + 2;
}

function drawSignatureBlock(doc: jsPDF, profile: TeacherSchoolProfile, startY: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY + 10;
  if (y + 36 > pageHeight - 10) {
    doc.addPage();
    y = 24;
  }

  const rightX = pageWidth - 78;
  const dateLabel = `${profile.kota}, ${formatTanggalID(getTodayISO())}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Mengetahui,', 18, y);
  doc.text(`Kepala ${profile.instansi}`, 18, y + 5);

  doc.text(dateLabel, rightX, y);
  doc.text(`Guru Mata Pelajaran ${profile.mataPelajaran}`, rightX, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(profile.kepalaSekolah, 18, y + 24);
  doc.text(profile.namaGuru, rightX, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${profile.nipKepalaSekolah}`, 18, y + 28.5);
  doc.text(`NIP. ${profile.nipGuru}`, rightX, y + 28.5);
}

export async function exportTablePdf(options: {
  fileName: string;
  profile: TeacherSchoolProfile;
  title: string;
  metaLines: string[];
  headers: string[];
  rows: (string | number)[][];
  landscape?: boolean;
}) {
  const doc = new jsPDF({
    orientation: options.landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const startY = await drawKopSuratAndFooter(
    doc,
    options.profile,
    options.title,
    options.metaLines
  );

  autoTable(doc, {
    startY,
    head: [options.headers],
    body: options.rows,
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 20;
  drawSignatureBlock(doc, options.profile, finalY);

  doc.save(options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`);
}

export async function exportModulAjarPdf(
  modul: ModulAjar,
  profile: TeacherSchoolProfile
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const startY = await drawKopSuratAndFooter(
    doc,
    profile,
    'MODUL AJAR KURIKULUM MERDEKA',
    [
      `Mata Pelajaran: ${profile.mataPelajaran}  |  Fase/Kelas: ${modul.fase} (${modul.kelasTarget})`,
      `Tahun Ajaran: ${profile.tahunAjaran}  |  Semester: ${modul.semester}  |  Alokasi: ${modul.alokasiWaktu}`,
    ]
  );

  const bodyRows: [string, string][] = [
    ['Judul Modul', modul.judul],
    ['Penyusun / Instansi', `${profile.namaGuru} / ${profile.instansi}`],
    ['Materi Pokok', modul.materiPokok],
    ['Model Pembelajaran', modul.modelPembelajaran],
    ['Target Peserta Didik', modul.targetPesertaDidik],
    ['Kompetensi Awal', modul.kompetensiAwal],
    ['Profil Pelajar Pancasila', modul.profilPelajarPancasila.join(', ')],
    ['Sarana & Prasarana', modul.saranaPrasarana],
    ['Tujuan Pembelajaran', modul.tujuanPembelajaran],
    ['Pemahaman Bermakna', modul.pemahamanBermakna],
    ['Pertanyaan Pemantik', modul.pertanyaanPemantik],
    ['Kegiatan Pendahuluan', modul.kegiatanPendahuluan],
    ['Kegiatan Inti', modul.kegiatanInti],
    ['Kegiatan Penutup', modul.kegiatanPenutup],
    ['Asesmen Pembelajaran', modul.asesmen],
    ['Pengayaan & Remedial', modul.pengayaanRemedial],
    ['Refleksi Guru & Siswa', modul.refleksi],
  ];

  autoTable(doc, {
    startY,
    head: [['Komponen Modul Ajar', 'Uraian Pembelajaran']],
    body: bodyRows,
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', fillColor: [241, 245, 249] },
      1: { cellWidth: 'auto' },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      valign: 'top',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 20;
  drawSignatureBlock(doc, profile, finalY);

  const safeTitle = modul.materiPokok.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Modul_Ajar_${safeTitle}_SMK_Garnesia.pdf`);
}
