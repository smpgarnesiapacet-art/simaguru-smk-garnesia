import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Moon,
  Printer,
  RotateCcw,
  Sun,
  X,
} from 'lucide-react';
import { useSimaguru } from '../context/SimaguruContext';
import { SCHOOL_LOGO_PATH, TEACHER_AVATAR_PATH } from '../utils/exporters';

export type NavSection =
  | 'dashboard'
  | 'master'
  | 'perangkat'
  | 'jurnal'
  | 'penilaian'
  | 'laporan';

interface LayoutShellProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenGuide: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
  { id: 'master', label: 'Manajemen Data Master', icon: Database },
  { id: 'perangkat', label: 'Perangkat Ajar', icon: BookOpen },
  { id: 'jurnal', label: 'Jurnal & Presensi', icon: ClipboardCheck },
  { id: 'penilaian', label: 'Penilaian & Asesmen', icon: GraduationCap },
  { id: 'laporan', label: 'Pusat Laporan & Cetak', icon: FileSpreadsheet },
];

export function LayoutShell({
  activeSection,
  onSelectSection,
  onOpenGuide,
  children,
}: LayoutShellProps) {
  const { state, theme, toggleTheme, isSaving, toast, resetDemoData } = useSimaguru();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Dashboard';

  const handleSelect = (id: NavSection) => {
    onSelectSection(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {!logoError ? (
            <img
              src={SCHOOL_LOGO_PATH}
              alt="Logo SMK Garnesia"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
              SG
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-tight text-white">
              SIMAGURU
            </div>
            <div className="truncate text-xs text-slate-400">
              {state.profile.instansi}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Tutup menu navigasi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Teacher Identity & Utility Footer */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-3">
          {!avatarError ? (
            <img
              src={TEACHER_AVATAR_PATH}
              alt={state.profile.namaGuru}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-teal-400 border border-slate-700">
              WS
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {state.profile.namaGuru}
            </div>
            <div className="truncate text-xs text-slate-400">
              {state.profile.mataPelajaran} · {state.profile.semester}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0 text-teal-400" />
            <span>Panduan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void resetDemoData();
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-[264px] shrink-0 border-r border-slate-800 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-[264px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Breadcrumb on left, concise controls on right */}
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden text-slate-500 dark:text-slate-400 sm:inline whitespace-nowrap">
                {state.profile.instansi}
              </span>
              <span className="hidden text-slate-400 dark:text-slate-600 sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="truncate font-semibold text-slate-900 dark:text-white">
                {activeLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 md:inline whitespace-nowrap font-mono tabular-nums">
              TA {state.profile.tahunAjaran} · Sem. {state.profile.semester}
              {isSaving ? ' · Menyimpan...' : ''}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 text-slate-600" />
                  <span className="hidden sm:inline">Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Terang</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSelect('laporan')}
              className="flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-3.5 text-xs font-semibold text-white hover:bg-teal-700 whitespace-nowrap shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1320px]">{children}</div>
        </main>
      </div>

      {/* Transient Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`no-print fixed bottom-5 right-5 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
              : 'border-teal-300 bg-white text-slate-900 dark:border-teal-800 dark:bg-slate-900 dark:text-slate-100'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
