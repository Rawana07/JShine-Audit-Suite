import React, { useState } from 'react';
import {
  Menu,
  Bell,
  KeyRound,
  Mail,
  Shield,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  LogOut,
  History,
} from 'lucide-react';
import { UserProfile, SystemNotification } from '../../types/erp';
import { NavTabId } from './Sidebar';
import { Cloud, CloudCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { CloudSyncStatus } from '../../services/cloudDb';

interface HeaderProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onOpenMobileSidebar: () => void;
  currentTab: NavTabId;
  onOpenChangePassword: () => void;
  onNavigateTab: (tab: NavTabId) => void;
  onResetData: () => void;
  notifications: SystemNotification[];
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
  cloudSyncStatus?: CloudSyncStatus;
  onForceSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  onOpenMobileSidebar,
  currentTab,
  onOpenChangePassword,
  onNavigateTab,
  onResetData,
  notifications,
  onMarkNotificationRead,
  onLogout,
  cloudSyncStatus,
  onForceSync,
  isSyncing = false,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabLabels: Record<NavTabId, string> = {
    dashboard: 'Enterprise Management Dashboard',
    clients: 'CRM & Client Master',
    'tax-clients': 'Income Tax (ITR) & GST Clients Master Utility',
    projects: 'Project Operations (Scenarios A, B & C)',
    locations: 'Site Location Master & Bulk Import',
    assignments: 'Assignment Engine & Resource Allocation',
    workforce: 'Workforce & Auditor Database',
    vendors: 'Vendor & Sub-Vendor Management',
    attendance: 'Daily Attendance & Approved Mandays',
    'field-ops': 'Field Operations & Execution',
    documents: 'Reports & Compliance Documents',
    billing: 'Client Billing & GST Invoicing',
    'vendor-payables': 'Vendor Bills & Settlements',
    'auditor-payables': 'Auditor Payables & Settlement Sheets',
    expenses: 'Expense Management & Approvals',
    accounting: 'Double-Entry Accounting & Financial Statements',
    'gst-tds': 'GST Registers & TDS Reconciliation',
    analytics: 'MIS, Profitability & Margin Analytics',
    'audit-trail': 'Detailed Audit Trail & Regulatory Compliance Log',
    notifications: 'System Alerts & Event Notifications',
    users: 'User Roles & Access Control (RBAC)',
    settings: 'System Configuration & Gmail Gateway',
    'vendor-portal': 'Dedicated Vendor Outsourcing Portal',
    'auditor-portal': 'Mobile-First Auditor Portal',
    'client-portal': 'Client Transparency Portal',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left section: mobile toggle and page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {tabLabels[currentTab] || 'JaySoftShine ERP'}
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              FY 2026-27
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            JaySoftShine • One Platform. Complete Business Control.
          </p>
        </div>
      </div>

      {/* Right section: role, change password, notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Cloud Database Sync Status */}
        <button
          type="button"
          onClick={async () => {
            if (onForceSync && !isManualSyncing) {
              setIsManualSyncing(true);
              try {
                await onForceSync();
              } finally {
                setTimeout(() => setIsManualSyncing(false), 800);
              }
            }
          }}
          title={
            cloudSyncStatus?.connected
              ? `Google Cloud Firestore: Live synchronized across all devices. Last sync: ${cloudSyncStatus.lastSyncedAt || 'Active'}. Click to force sync.`
              : `Cloud connection status: ${cloudSyncStatus?.error || 'Syncing...'}. Click to reconnect.`
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              cloudSyncStatus?.connected
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-500'
            }`}
          />
          <RefreshCw
            className={`w-3 h-3 text-slate-500 ${
              isSyncing || isManualSyncing ? 'animate-spin text-slate-900' : ''
            }`}
          />
          <span className="hidden sm:inline font-mono">
            {isSyncing || isManualSyncing ? 'Syncing...' : 'Cloud Sync: Live'}
          </span>
        </button>

        {/* Change Admin Password shortcut */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            type="button"
            onClick={onOpenChangePassword}
            title="Change Admin Master Password"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden lg:inline">Admin Password</span>
          </button>
        )}

        {/* Gmail Setup shortcut */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            title="Google Workspace Gmail Gateway"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-red-600" />
            <span>Gmail Gateway</span>
          </button>
        )}

        {/* Notification bell with dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} unread)</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('notifications')}
                  className="text-[11px] text-slate-600 hover:text-black font-medium"
                >
                  View All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-slate-50/70 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-900 font-semibold">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-slate-900 shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-slate-400" />
                <span>{currentUser.role.replace('_', ' ')}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-left"
              onClick={() => setShowRoleMenu(false)}
            >
              {/* Authenticated User Account Overview */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {currentUser.department || 'Operations'}
                  </span>
                </div>
              </div>

              {/* Account & Security Actions */}
              <div className="py-2 px-2 space-y-1">
                {currentUser.role === 'SUPER_ADMIN' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenChangePassword()}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Change Master Password</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('settings')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Mail SMTP Configuration</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab('users')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>User Roles & RBAC Matrix</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onNavigateTab('audit-trail')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit Trail & Security Logs</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-100 px-2">
                <button
                  type="button"
                  onClick={() => onLogout()}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-bold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out of ERP Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Explicit Header Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition-colors shadow-2xs"
          title="Sign out of current account and return to login page"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
          <span className="hidden md:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
};
