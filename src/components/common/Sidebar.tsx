import React from 'react';
import {
  LayoutDashboard,
  Users2,
  FolderGit2,
  MapPin,
  FileCheck,
  UserCheck,
  Briefcase,
  CalendarCheck2,
  Compass,
  FileText,
  Receipt,
  Building2,
  WalletCards,
  ReceiptIndianRupee,
  BookOpenCheck,
  Percent,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  ChevronRight,
  ExternalLink,
  History,
  LogOut,
  Shield,
  User,
  FileCheck2,
} from 'lucide-react';
import { UserRole } from '../../types/erp';
import type { NavTabId } from '../../types/erp';

export type { NavTabId };

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  userRole: UserRole;
  userName?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  unreadCount?: number;
  allowedTabs?: NavTabId[];
  onLogout?: () => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: any;
  count?: number;
  tag?: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  userName = 'Jayesh Vyas',
  isMobileOpen,
  onCloseMobile,
  unreadCount = 0,
  allowedTabs,
  onLogout,
}) => {
  const allNavGroups: NavGroup[] = [
    {
      label: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'CRM & Clients', icon: Users2 },
        { id: 'tax-clients', label: 'ITR & GST Clients', icon: FileCheck2, tag: 'Utility' },
        { id: 'projects', label: 'Projects', icon: FolderGit2, badge: 'Scenarios A/B/C' },
        { id: 'locations', label: 'Locations Master', icon: MapPin },
        { id: 'assignments', label: 'Assignments Engine', icon: FileCheck },
      ],
    },
    {
      label: 'Workforce & Field',
      items: [
        { id: 'workforce', label: 'Workforce / Auditors', icon: UserCheck },
        { id: 'vendors', label: 'Vendor Management', icon: Briefcase },
        { id: 'attendance', label: 'Attendance & Mandays', icon: CalendarCheck2 },
        { id: 'field-ops', label: 'Field Operations', icon: Compass },
        { id: 'documents', label: 'Documents & Reports', icon: FileText },
      ],
    },
    {
      label: 'Financials & Payables',
      items: [
        { id: 'billing', label: 'Client Invoicing', icon: Receipt },
        { id: 'vendor-payables', label: 'Vendor Payables', icon: Building2 },
        { id: 'auditor-payables', label: 'Auditor Payables', icon: WalletCards },
        { id: 'expenses', label: 'Expenses Claims', icon: ReceiptIndianRupee },
      ],
    },
    {
      label: 'Accounting & Analytics',
      items: [
        { id: 'accounting', label: 'Double-Entry Books', icon: BookOpenCheck },
        { id: 'gst-tds', label: 'GST & TDS Returns', icon: Percent },
        { id: 'analytics', label: 'MIS & Profitability', icon: BarChart3 },
      ],
    },
    {
      label: 'Specialized Portals',
      items: [
        { id: 'vendor-portal', label: 'Vendor Portal View', icon: ExternalLink, tag: 'Partner' },
        { id: 'auditor-portal', label: 'Auditor Field App', icon: ExternalLink, tag: 'Mobile' },
        { id: 'client-portal', label: 'Client Portal View', icon: ExternalLink, tag: 'Client' },
      ],
    },
    {
      label: 'Administration & Governance',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
        { id: 'audit-trail', label: 'Audit Trail & Compliance', icon: History, tag: 'IFC' },
        { id: 'users', label: 'User Roles & Access Control', icon: ShieldCheck },
        { id: 'settings', label: 'Settings & SMTP', icon: Settings },
      ],
    },
  ];

  // Filter groups according to RBAC allowed tabs
  const filteredNavGroups = allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!allowedTabs) return true;
        return allowedTabs.includes(item.id);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md">
              JS
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                JAYSOFTSHINE
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                Audit & Operations ERP
              </div>
            </div>
          </div>
        </div>

        {/* User Role Access Banner */}
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-200 block truncate text-[11px]">{userName}</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {userRole === 'SUPER_ADMIN' ? 'UNRESTRICTED' : 'RESTRICTED'}
          </span>
        </div>

        {/* Nav lists */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          {filteredNavGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 font-mono">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.count && item.count > 0 ? (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                          {item.count}
                        </span>
                      ) : null}
                      {item.tag ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${isActive ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-400'}`}>
                          {item.tag}
                        </span>
                      ) : null}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info & Logout button */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-[11px] text-slate-400 space-y-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Session</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-medium text-slate-400 text-[10px]">JaySoftShine ERP</span>
            <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v2.4 (Prod)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
