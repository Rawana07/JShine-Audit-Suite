import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  Lock,
  Edit2,
  KeyRound,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Plus,
  AlertTriangle,
  Info,
  Check,
  X,
  Layers,
  Trash2,
  Mail,
  Send,
  CreditCard,
  Building,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, UserRole, NavTabId, RolePermissionConfig, BankDetails } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateIndian } from '../../utils/rules';
import { Modal } from '../common/Modal';
import { sendWelcomeUserEmail, sendPasswordResetEmail } from '../../services/emailService';

interface UserManagementViewProps {
  users: UserProfile[];
  currentUser: UserProfile;
  rolePermissions: RolePermissionConfig[];
  onSwitchUser: (user: UserProfile) => void;
  onAddUser: (user: UserProfile, sendWelcomeEmail?: boolean) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser?: (userId: string) => void;
  onChangeUserPassword?: (userId: string, newPassword: string, sendEmail?: boolean) => void;
  onUpdateRolePermissions: (roleConfig: RolePermissionConfig) => void;
  onResetRolePermissions: () => void;
}

const ALL_MODULES: { id: NavTabId; label: string; category: string }[] = [
  { id: 'dashboard', label: 'Dashboard', category: 'Core' },
  { id: 'clients', label: 'CRM & Clients', category: 'Core' },
  { id: 'projects', label: 'Projects', category: 'Core' },
  { id: 'locations', label: 'Locations Master', category: 'Core' },
  { id: 'assignments', label: 'Assignments Engine', category: 'Core' },
  { id: 'workforce', label: 'Workforce / Auditors', category: 'Field' },
  { id: 'vendors', label: 'Vendor Management', category: 'Field' },
  { id: 'attendance', label: 'Attendance & Mandays', category: 'Field' },
  { id: 'field-ops', label: 'Field Operations', category: 'Field' },
  { id: 'documents', label: 'Documents & Reports', category: 'Field' },
  { id: 'billing', label: 'Client Invoicing', category: 'Financials' },
  { id: 'vendor-payables', label: 'Vendor Payables', category: 'Financials' },
  { id: 'auditor-payables', label: 'Auditor Payables', category: 'Financials' },
  { id: 'expenses', label: 'Expense Claims', category: 'Financials' },
  { id: 'accounting', label: 'Double-Entry Ledgers', category: 'Accounting' },
  { id: 'gst-tds', label: 'GST & TDS Returns', category: 'Accounting' },
  { id: 'analytics', label: 'MIS & Analytics', category: 'Accounting' },
  { id: 'vendor-portal', label: 'Vendor Outsourcing Portal', category: 'Portals' },
  { id: 'auditor-portal', label: 'Auditor Field App', category: 'Portals' },
  { id: 'client-portal', label: 'Client Portal View', category: 'Portals' },
  { id: 'notifications', label: 'Notifications', category: 'Admin' },
  { id: 'audit-trail', label: 'Audit Trail & Compliance', category: 'Admin' },
  { id: 'users', label: 'User Roles & RBAC', category: 'Admin' },
  { id: 'settings', label: 'Settings & SMTP', category: 'Admin' },
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  rolePermissions,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onChangeUserPassword,
  onUpdateRolePermissions,
  onResetRolePermissions,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingRoleConfig, setEditingRoleConfig] = useState<RolePermissionConfig | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserProfile | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [dispatchPwdEmail, setDispatchPwdEmail] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Email notifications
  const [emailNotice, setEmailNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sendingMailUserId, setSendingMailUserId] = useState<string | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('OFFICE_ADMIN');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Helper to generate secure temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `JSS#${code}!${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleOpenAddUser = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('OFFICE_ADMIN');
    setNewUserPhone('');
    setNewUserDept('Operations');
    setNewUserAddress('');
    setNewUserPassword(generateTempPassword());
    setSendWelcomeEmail(true);
    setIsAddUserOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const assignedPassword = newUserPassword.trim() || generateTempPassword();

    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      phone: newUserPhone.trim() || '+91 98200 00000',
      department: newUserDept.trim() || 'Operations',
      address: newUserAddress.trim(),
      password: assignedPassword,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    onAddUser(user, sendWelcomeEmail);
    setIsAddUserOpen(false);

    if (sendWelcomeEmail) {
      setEmailNotice({
        message: `User created! Dispatching welcome confirmation email to ${user.email} via Resend...`,
        type: 'success',
      });
      try {
        const mailRes = await sendWelcomeUserEmail({
          name: user.name,
          email: user.email,
          password: assignedPassword,
          role: user.role,
          department: user.department,
        });
        if (mailRes.success) {
          const note = mailRes.sandboxDeliveredTo ? ` (delivered to ${mailRes.sandboxDeliveredTo})` : '';
          setEmailNotice({
            message: `Welcome credentials email successfully delivered to ${user.email}${note}!`,
            type: 'success',
          });
        } else {
          setEmailNotice({
            message: `User created. Note: Mail delivery notice: ${mailRes.error || 'Pending custom domain in Resend'}`,
            type: 'error',
          });
        }
      } catch (err: any) {
        setEmailNotice({
          message: `User created. Mail delivery notice: ${err.message}`,
          type: 'error',
        });
      }
      setTimeout(() => setEmailNotice(null), 6000);
    }
  };

  const handleSendWelcomeMailDirect = async (user: UserProfile) => {
    setSendingMailUserId(user.id);
    const pwd = user.password || 'Jshine@2329';
    try {
      const mailRes = await sendWelcomeUserEmail({
        name: user.name,
        email: user.email,
        password: pwd,
        role: user.role,
        department: user.department,
      });
      if (mailRes.success) {
        const note = mailRes.sandboxDeliveredTo ? ` (Delivered to Resend account ${mailRes.sandboxDeliveredTo})` : '';
        setEmailNotice({
          message: `Welcome email with login credentials sent to ${user.email}${note}!`,
          type: 'success',
        });
      } else {
        setEmailNotice({
          message: `Mail status: ${mailRes.error || 'Resend queued'}`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setEmailNotice({
        message: `Failed to dispatch email: ${err.message}`,
        type: 'error',
      });
    } finally {
      setSendingMailUserId(null);
      setTimeout(() => setEmailNotice(null), 6000);
    }
  };

  const handleOpenPasswordModal = (user: UserProfile) => {
    setPasswordModalUser(user);
    setNewPasswordVal(generateTempPassword());
    setDispatchPwdEmail(true);
  };

  const handleSaveUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordVal.trim()) return;

    setPasswordSaving(true);
    const targetUserId = passwordModalUser.id;
    const targetEmail = passwordModalUser.email;
    const targetName = passwordModalUser.name;
    const newPwd = newPasswordVal.trim();

    if (onChangeUserPassword) {
      onChangeUserPassword(targetUserId, newPwd, dispatchPwdEmail);
    }

    if (dispatchPwdEmail) {
      try {
        const mailRes = await sendPasswordResetEmail({
          name: targetName,
          email: targetEmail,
          newPassword: newPwd,
        });
        const note = mailRes.sandboxDeliveredTo ? ` (delivered to ${mailRes.sandboxDeliveredTo})` : '';
        setEmailNotice({
          message: `Password updated and dispatched to ${targetEmail}${note}!`,
          type: 'success',
        });
      } catch (err: any) {
        setEmailNotice({
          message: `Password updated. Mail delivery notice: ${err.message}`,
          type: 'error',
        });
      }
      setTimeout(() => setEmailNotice(null), 6000);
    } else {
      setEmailNotice({
        message: `Password for ${targetName} updated to "${newPwd}"!`,
        type: 'success',
      });
      setTimeout(() => setEmailNotice(null), 5000);
    }

    setPasswordSaving(false);
    setPasswordModalUser(null);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete || !onDeleteUser) return;
    onDeleteUser(userToDelete.id);
    setEmailNotice({
      message: `User account for ${userToDelete.name} (${userToDelete.email}) was removed.`,
      type: 'success',
    });
    setTimeout(() => setEmailNotice(null), 5000);
    setUserToDelete(null);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  const handleSaveRoleConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleConfig) return;
    onUpdateRolePermissions(editingRoleConfig);
    setEditingRoleConfig(null);
  };

  const toggleModuleForRole = (moduleId: NavTabId) => {
    if (!editingRoleConfig) return;
    const current = editingRoleConfig.allowedTabs;
    const exists = current.includes(moduleId);
    const updated = exists
      ? current.filter((m) => m !== moduleId)
      : [...current, moduleId];

    setEditingRoleConfig({
      ...editingRoleConfig,
      allowedTabs: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-slate-900" />
            Security Governance & Access Control
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Role-Based Access Control (RBAC) & Rights Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Admin can manage, add, and customize rights and permitted pages for all roles. Vendor and Auditor access is strictly restricted to prevent unauthorized exposure of financials and client master data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'users' ? (
            <button
              type="button"
              onClick={() => setIsAddUserOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add New ERP User
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetRolePermissions}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Reset all role configurations to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Permissions to Default
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          User Accounts Directory ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-slate-950 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Access Rights & Permissions Matrix ({rolePermissions.length} Roles)
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS MASTER */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ACCOUNTS">Accounts (CA)</option>
                <option value="OFFICE_ADMIN">Office Admin</option>
                <option value="VENDOR">Vendor Partner</option>
                <option value="AUDITOR">Field Auditor</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>

          {/* Email Notification Toast */}
          {emailNotice && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                emailNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{emailNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotice(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">User Name & Email</th>
                    <th className="py-3 px-4">Role Classification</th>
                    <th className="py-3 px-4">Department / Org</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Bank Details</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <UserPlus className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="font-semibold text-slate-600">No user accounts found</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            Click "Add New ERP User" to onboard a team member, vendor partner, or field auditor.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      const hasBank = !!u.bankDetails?.accountNumber;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded">
                                  Active Session
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-slate-950 text-white border-slate-950'
                                  : u.role === 'VENDOR'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : u.role === 'AUDITOR'
                                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                                  : u.role === 'ACCOUNTS'
                                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700">
                            {u.department || 'Operations'}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600">
                            {u.phone || 'N/A'}
                          </td>

                          <td className="py-3 px-4">
                            {hasBank ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CreditCard className="w-3 h-3 text-emerald-600" />
                                {u.bankDetails?.bankName || 'Verified'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Not Set
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={u.status} />
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setEditingUser(u)}
                                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit user profile & bank credentials"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(u)}
                                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reset / Set Password for this user"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                Password
                              </button>

                              <button
                                type="button"
                                disabled={sendingMailUserId === u.id}
                                onClick={() => handleSendWelcomeMailDirect(u)}
                                className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                title="Dispatch credentials welcome email to user via Resend (smtp.resend.com)"
                              >
                                <Send className="w-3 h-3 text-blue-600" />
                                {sendingMailUserId === u.id ? 'Sending...' : 'Mail'}
                              </button>

                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                    onUpdateUser({ ...u, status: updatedStatus });
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                    u.status === 'ACTIVE'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={u.status === 'ACTIVE' ? 'Deactivate user login access' : 'Activate user login access'}
                                >
                                  {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                </button>
                              )}

                              {!isCurrent && u.role !== 'SUPER_ADMIN' && onDeleteUser && (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(u)}
                                  className="p-1 rounded bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Permanently remove user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCESS RIGHTS & ROLE MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Security Policy Callout Banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  Strict Vendor & Auditor Access Isolation Policy
                </h4>
                <p className="mt-1 leading-relaxed text-amber-800">
                  To safeguard trade secrets and commercial privacy, <strong>Vendors and Auditors are barred from accessing all internal ERP modules</strong>. Vendors only have access to their dedicated Vendor Portal (own work orders, manpower deployment, and invoices). Auditors only have access to their Auditor Field App (assigned site checklists, GPS manday submission, and personal settlement sheets).
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                    ✓ Client Rates Hidden
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                    ✓ Accounting Books Blocked
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                    ✓ Other Vendors Isolated
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                    ✓ Audit Trail Protected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Matrix Cards & Permissions */}
          <div className="space-y-3">
            {rolePermissions.map((rp) => {
              const isVendorOrAuditor = rp.role === 'VENDOR' || rp.role === 'AUDITOR' || rp.role === 'CLIENT' || rp.role === 'SUB_VENDOR';
              const isSuperAdmin = rp.role === 'SUPER_ADMIN';

              return (
                <div
                  key={rp.role}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {rp.role}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{rp.title}</h3>
                        {isVendorOrAuditor && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Restricted Scope
                          </span>
                        )}
                        {isSuperAdmin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Full Unrestricted Access
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{rp.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingRoleConfig(rp)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors self-start md:self-center"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Configure Access Rights & Modules
                    </button>
                  </div>

                  {/* Permissions & Allowed Modules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 text-xs">
                    {/* Allowed Modules */}
                    <div className="md:col-span-8">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 font-mono">
                        Permitted Modules ({rp.allowedTabs.length} Pages Accessible)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rp.allowedTabs.map((tabId) => (
                          <span
                            key={tabId}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {tabId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Operational Privileges */}
                    <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                        Privileges & Capabilities
                      </span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">Can Add / Edit Masters:</span>
                        {rp.canAddEdit ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Blocked</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">Can Approve Mandays:</span>
                        {rp.canApproveMandays ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Blocked</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">Can Disburse Funds:</span>
                        {rp.canDisburseFunds ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Blocked</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">Can Manage Roles / RBAC:</span>
                        {rp.canManageRoles ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Blocked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD USER */}
      {isAddUserOpen && (
        <Modal
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          title="Create New User Account"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Anand Kadam"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="e.g. anand@jaysoftshine.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Classification</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OFFICE_ADMIN">Office Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="ACCOUNTS">Accounts (CA)</option>
                  <option value="VENDOR">Vendor Partner</option>
                  <option value="AUDITOR">Field Auditor</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department / Organization</label>
                <input
                  type="text"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  placeholder="e.g. Audit & Assurance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office / Billing Address</label>
                <input
                  type="text"
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Generated Temporary Password */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-800">
                  Initial Password
                </label>
                <button
                  type="button"
                  onClick={() => setNewUserPassword(generateTempPassword())}
                  className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                The user can change this password after logging in from their profile dropdown.
              </p>
            </div>

            {/* Resend Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600"
              />
              <div>
                <span className="font-bold text-emerald-950 block text-xs">
                  Send welcome confirmation email with credentials via Resend
                </span>
                <span className="text-[11px] text-emerald-800">
                  Sends login URL, corporate email ID, and initial password immediately.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
              >
                Create Account & Dispatch Mail
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT USER */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Classification</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OFFICE_ADMIN">Office Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="ACCOUNTS">Accounts (CA)</option>
                  <option value="VENDOR">Vendor Partner</option>
                  <option value="AUDITOR">Field Auditor</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE (Deactivated)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office / Residential Address</label>
              <input
                type="text"
                value={editingUser.address || ''}
                onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                placeholder="Street, City, State, PIN"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Bank Details Section for Vendor / Auditor / Staff */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Bank Settlement & Payout Details
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: editingUser.name,
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          bankName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. HDFC Bank Ltd"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.accountHolderName || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          accountHolderName: e.target.value,
                        },
                      })
                    }
                    placeholder="As per bank passbook"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. 50100492817291"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.ifscCode || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          ifscCode: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.branch || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          branch: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. C-Scheme, Jaipur"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={editingUser.bankDetails?.upiId || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        bankDetails: {
                          ...(editingUser.bankDetails || {
                            bankName: '',
                            accountHolderName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: '',
                          }),
                          upiId: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. vendor@okhdfcbank"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: CONFIGURE ROLE PERMISSIONS */}
      {editingRoleConfig && (
        <Modal
          isOpen={!!editingRoleConfig}
          onClose={() => setEditingRoleConfig(null)}
          title={`Configure Access Rights: ${editingRoleConfig.title} (${editingRoleConfig.role})`}
          maxWidth="4xl"
        >
          <form onSubmit={handleSaveRoleConfig} className="space-y-5 text-xs">
            {/* Role Header Info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-semibold text-slate-800">Role Title: {editingRoleConfig.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{editingRoleConfig.description}</div>
            </div>

            {/* Privileges Switches */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 font-mono">
                System Privileges & Authority
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoleConfig.canAddEdit}
                    onChange={(e) => setEditingRoleConfig({ ...editingRoleConfig, canAddEdit: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Add & Edit Masters</div>
                    <div className="text-[10px] text-slate-400">Create projects/clients</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoleConfig.canApproveMandays}
                    onChange={(e) => setEditingRoleConfig({ ...editingRoleConfig, canApproveMandays: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Approve Mandays</div>
                    <div className="text-[10px] text-slate-400">Attendance signoff</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoleConfig.canDisburseFunds}
                    onChange={(e) => setEditingRoleConfig({ ...editingRoleConfig, canDisburseFunds: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Disburse Funds</div>
                    <div className="text-[10px] text-slate-400">Pay vendor & auditor</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRoleConfig.canManageRoles}
                    onChange={(e) => setEditingRoleConfig({ ...editingRoleConfig, canManageRoles: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Manage Roles</div>
                    <div className="text-[10px] text-slate-400">RBAC permissions</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Permitted Modules Checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                  Accessible Navigation Pages ({editingRoleConfig.allowedTabs.length} of {ALL_MODULES.length} Selected)
                </h4>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEditingRoleConfig({
                      ...editingRoleConfig,
                      allowedTabs: ALL_MODULES.map((m) => m.id),
                    })}
                    className="text-slate-900 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setEditingRoleConfig({
                      ...editingRoleConfig,
                      allowedTabs: [],
                    })}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {ALL_MODULES.map((mod) => {
                  const isChecked = editingRoleConfig.allowedTabs.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-white border-slate-900 shadow-2xs'
                          : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleModuleForRole(mod.id)}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate text-xs">
                          {mod.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mod.id} • {mod.category}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-mono">
                Changes will take effect immediately for all {editingRoleConfig.role} sessions.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoleConfig(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                >
                  Save Access Rights
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: CHANGE USER PASSWORD */}
      {passwordModalUser && (
        <Modal
          isOpen={!!passwordModalUser}
          onClose={() => setPasswordModalUser(null)}
          title={`Reset Password: ${passwordModalUser.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveUserPassword} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500">Corporate Account:</div>
              <div className="font-bold text-slate-900 text-sm">{passwordModalUser.email}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Role: {passwordModalUser.role}</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">New Password</label>
                <button
                  type="button"
                  onClick={() => setNewPasswordVal(generateTempPassword())}
                  className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Generate Secure
                </button>
              </div>
              <input
                type="text"
                required
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={dispatchPwdEmail}
                onChange={(e) => setDispatchPwdEmail(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-600"
              />
              <div>
                <span className="font-bold text-emerald-950 block text-xs">
                  Dispatch new password to user via Resend email
                </span>
                <span className="text-[11px] text-emerald-800">
                  Sends an automated password reset notification with instructions.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: DELETE USER CONFIRMATION */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          title="Confirm User Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <p className="font-semibold text-sm mb-1">Are you sure you want to delete this user?</p>
              <p className="text-[11px]">
                This will permanently revoke all access credentials and portal authorizations for:
              </p>
              <div className="mt-2 font-mono font-bold text-slate-900 bg-white/80 p-2 rounded border border-rose-100">
                {userToDelete.name} ({userToDelete.email})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteUser && userToDelete) {
                    onDeleteUser(userToDelete.id);
                  }
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
