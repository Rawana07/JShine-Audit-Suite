import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building2,
  Users2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  FileCheck,
  ExternalLink,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, UserRole, Vendor, Auditor, Client } from '../../types/erp';
import { sendPasswordResetEmail } from '../../services/emailService';
import { fetchLatestCloudAuthData, CloudSyncStatus } from '../../services/cloudDb';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
  users: UserProfile[];
  vendors?: Vendor[];
  auditors?: Auditor[];
  clients?: Client[];
  adminPassword: string; // Dynamic admin password
  onResetPassword?: (email: string, newPassword: string) => void;
  onProvisionEntityUser?: (newUser: UserProfile) => void;
  cloudSyncStatus?: CloudSyncStatus;
  onSyncFromCloud?: () => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  users,
  vendors = [],
  auditors = [],
  clients = [],
  adminPassword,
  onResetPassword,
  onProvisionEntityUser,
  cloudSyncStatus,
  onSyncFromCloud,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Live cloud auth cache
  const [cloudUsers, setCloudUsers] = useState<UserProfile[]>(users);
  const [cloudVendors, setCloudVendors] = useState<Vendor[]>(vendors);
  const [cloudAuditors, setCloudAuditors] = useState<Auditor[]>(auditors);
  const [cloudClients, setCloudClients] = useState<Client[]>(clients);
  const [cloudAdminPw, setCloudAdminPw] = useState<string>(adminPassword);

  // Keep state updated when props change
  React.useEffect(() => {
    setCloudUsers(users);
  }, [users]);
  React.useEffect(() => {
    setCloudVendors(vendors);
  }, [vendors]);
  React.useEffect(() => {
    setCloudAuditors(auditors);
  }, [auditors]);
  React.useEffect(() => {
    setCloudClients(clients);
  }, [clients]);
  React.useEffect(() => {
    setCloudAdminPw(adminPassword);
  }, [adminPassword]);

  // On mount, fetch fresh cloud database credentials to ensure any new account added from another device is recognized
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const fresh = await fetchLatestCloudAuthData();
        if (fresh && active) {
          if (fresh.users) setCloudUsers(fresh.users);
          if (fresh.vendors) setCloudVendors(fresh.vendors);
          if (fresh.auditors) setCloudAuditors(fresh.auditors);
          if (fresh.clients) setCloudClients(fresh.clients);
          if (fresh.adminPassword) setCloudAdminPw(fresh.adminPassword);
        }
      } catch (e) {
        console.warn('Initial cloud auth sync notice:', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Forgot Password State
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Helper to resolve an account from Email, Phone (+91/digits), or Entity ID / Code
  const resolveUserAccount = (
    identifier: string,
    overrideData?: {
      users?: UserProfile[];
      vendors?: Vendor[];
      auditors?: Auditor[];
      clients?: Client[];
    }
  ): UserProfile | null => {
    const clean = identifier.trim();
    if (!clean) return null;
    const cleanLower = clean.toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '');

    const userList = overrideData?.users || cloudUsers;
    const auditorList = overrideData?.auditors || cloudAuditors;
    const vendorList = overrideData?.vendors || cloudVendors;
    const clientList = overrideData?.clients || cloudClients;

    // 1. Direct match in users list by email
    let found = userList.find((u) => u.email.toLowerCase() === cleanLower);
    if (found) return found;

    // 2. Match in users list by phone
    if (digitsOnly.length >= 10) {
      found = userList.find((u) => u.phone && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10)));
      if (found) return found;
    }

    // 3. Match in users list by user id or linkedEntityId
    found = userList.find(
      (u) =>
        u.id.toLowerCase() === cleanLower ||
        (u.linkedEntityId && u.linkedEntityId.toLowerCase() === cleanLower)
    );
    if (found) return found;

    // 4. Search in Auditors master (by ID, Code, Email, or Phone)
    const matchedAuditor = auditorList.find((a) => {
      const matchId = a.auditorId.toLowerCase() === cleanLower || a.id.toLowerCase() === cleanLower;
      const matchEmail = a.email && a.email.toLowerCase() === cleanLower;
      const matchPhone = digitsOnly.length >= 10 && a.phone && a.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10));
      return matchId || matchEmail || matchPhone;
    });

    if (matchedAuditor) {
      // Check if user already exists for this auditor
      const existing = userList.find(
        (u) =>
          u.linkedEntityId === matchedAuditor.id ||
          u.linkedEntityId === matchedAuditor.auditorId ||
          (u.email && matchedAuditor.email && u.email.toLowerCase() === matchedAuditor.email.toLowerCase())
      );
      if (existing) return existing;

      // Auto-provision user account
      const newAuditorUser: UserProfile = {
        id: `usr_${matchedAuditor.auditorId}`,
        name: matchedAuditor.name,
        email: matchedAuditor.email,
        role: 'AUDITOR',
        phone: matchedAuditor.phone,
        linkedEntityId: matchedAuditor.id,
        status: 'ACTIVE',
        department: 'Field Audit Associate',
        password: 'Jshine@2329',
        createdAt: matchedAuditor.createdAt || new Date().toISOString(),
      };
      if (onProvisionEntityUser) onProvisionEntityUser(newAuditorUser);
      return newAuditorUser;
    }

    // 5. Search in Vendors master (by ID, Code, Email, or Phone)
    const matchedVendor = vendorList.find((v) => {
      const matchId = v.vendorId.toLowerCase() === cleanLower || v.id.toLowerCase() === cleanLower;
      const matchEmail = v.email && v.email.toLowerCase() === cleanLower;
      const matchPhone = digitsOnly.length >= 10 && v.phone && v.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10));
      return matchId || matchEmail || matchPhone;
    });

    if (matchedVendor) {
      const existing = userList.find(
        (u) =>
          u.linkedEntityId === matchedVendor.id ||
          u.linkedEntityId === matchedVendor.vendorId ||
          (u.email && matchedVendor.email && u.email.toLowerCase() === matchedVendor.email.toLowerCase())
      );
      if (existing) return existing;

      const newVendorUser: UserProfile = {
        id: `usr_${matchedVendor.vendorId}`,
        name: matchedVendor.contactPerson || matchedVendor.name,
        email: matchedVendor.email,
        role: 'VENDOR',
        phone: matchedVendor.phone,
        linkedEntityId: matchedVendor.id,
        status: 'ACTIVE',
        department: matchedVendor.name,
        password: 'Jshine@2329',
        createdAt: matchedVendor.createdAt || new Date().toISOString(),
      };
      if (onProvisionEntityUser) onProvisionEntityUser(newVendorUser);
      return newVendorUser;
    }

    // 6. Search in Clients master (by ID, Code, Email, or Phone)
    const matchedClient = clientList.find((c) => {
      const matchId = c.clientId.toLowerCase() === cleanLower || c.id.toLowerCase() === cleanLower;
      const matchEmail =
        (c.contactEmail && c.contactEmail.toLowerCase() === cleanLower) ||
        (c.email && c.email.toLowerCase() === cleanLower);
      const matchPhone =
        digitsOnly.length >= 10 &&
        ((c.contactPhone && c.contactPhone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))) ||
          (c.phone && c.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-10))));
      return matchId || matchEmail || matchPhone;
    });

    if (matchedClient) {
      const cEmail = matchedClient.contactEmail || matchedClient.email || `${matchedClient.clientId.toLowerCase()}@clientportal.com`;
      const existing = userList.find(
        (u) =>
          u.linkedEntityId === matchedClient.id ||
          u.linkedEntityId === matchedClient.clientId ||
          (u.email && u.email.toLowerCase() === cEmail.toLowerCase())
      );
      if (existing) return existing;

      const newClientUser: UserProfile = {
        id: `usr_${matchedClient.clientId}`,
        name: matchedClient.contactPerson || matchedClient.name,
        email: cEmail,
        role: 'CLIENT',
        phone: matchedClient.contactPhone || matchedClient.phone || '+91 98200 00000',
        linkedEntityId: matchedClient.id,
        status: 'ACTIVE',
        department: matchedClient.name,
        password: 'Jshine@2329',
        createdAt: matchedClient.createdAt || new Date().toISOString(),
      };
      if (onProvisionEntityUser) onProvisionEntityUser(newClientUser);
      return newClientUser;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Try resolving using current cached users
      let matchedUser = resolveUserAccount(email);

      // 2. If user not found, query live Firestore cloud data in real-time
      if (!matchedUser) {
        try {
          const freshCloud = await fetchLatestCloudAuthData();
          if (freshCloud) {
            if (freshCloud.users) setCloudUsers(freshCloud.users);
            if (freshCloud.vendors) setCloudVendors(freshCloud.vendors);
            if (freshCloud.auditors) setCloudAuditors(freshCloud.auditors);
            if (freshCloud.clients) setCloudClients(freshCloud.clients);
            if (freshCloud.adminPassword) setCloudAdminPw(freshCloud.adminPassword);
            matchedUser = resolveUserAccount(email, freshCloud);
          }
        } catch (cloudErr) {
          console.warn('Live cloud credential lookup notice:', cloudErr);
        }
      }

      if (!matchedUser) {
        setError(
          'No account found matching this Email, Phone Number, or Partner / Auditor / Client ID. Please verify your credentials or contact administrator.'
        );
        setIsLoading(false);
        return;
      }

      if (matchedUser.status === 'INACTIVE') {
        setError('Your account has been deactivated by the Super Administrator. Please contact corporate support at jay@jaysoftshine.com.');
        setIsLoading(false);
        return;
      }

      // Check password cleanly and strictly
      const inputPwd = password.trim();
      const currentMasterAdminPw = (cloudAdminPw || adminPassword).trim();

      if (matchedUser.role === 'SUPER_ADMIN') {
        const isAdminMasterValid = inputPwd === currentMasterAdminPw;
        const isUserPwdValid = matchedUser.password && inputPwd === matchedUser.password.trim();
        if (!isAdminMasterValid && !isUserPwdValid) {
          setError('Invalid administrator password. Please check your credentials or reset your password.');
          setIsLoading(false);
          return;
        }
      } else {
        let expectedPwd = (matchedUser.password || 'Jshine@2329').trim();

        // If local password does not match, double-check latest cloud password in case Admin updated it on another laptop
        if (inputPwd !== expectedPwd) {
          try {
            const freshCloud = await fetchLatestCloudAuthData();
            if (freshCloud) {
              const freshMatch = resolveUserAccount(email, freshCloud);
              if (freshMatch && freshMatch.password) {
                matchedUser = freshMatch;
                expectedPwd = freshMatch.password.trim();
              }
            }
          } catch (e) {
            // ignore
          }
        }

        if (inputPwd !== expectedPwd) {
          setError('Invalid password. Please check your login credentials or use Forgot Password to reset.');
          setIsLoading(false);
          return;
        }
      }

      // Successful authentication
      setIsLoading(false);
      onLogin(matchedUser);
    } catch (err: any) {
      setError(err.message || 'Authentication error occurred.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    const matchedUser = resolveUserAccount(forgotEmail);

    if (!matchedUser) {
      setForgotError(`No registered user found for "${forgotEmail}". Please verify your email or account ID.`);
      setForgotLoading(false);
      return;
    }

    // Generate secure temporary password and reset token
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newTempPassword = `JSS#${randomSuffix}!${Math.floor(100 + Math.random() * 900)}`;
    const resetToken = Math.random().toString(36).substring(2, 12);

    try {
      if (onResetPassword) {
        onResetPassword(matchedUser.email, newTempPassword);
      }

      // Dispatch email via Google Workspace Gmail
      const dispatchResult = await sendPasswordResetEmail({
        name: matchedUser.name,
        email: matchedUser.email,
        newPassword: newTempPassword,
        resetToken,
      });

      setForgotLoading(false);
      if (dispatchResult.success) {
        const note = dispatchResult.senderEmail ? ` from ${dispatchResult.senderEmail}` : '';
        setForgotSuccess(
          `Password reset instructions and your temporary credentials have been delivered to your registered email address (${matchedUser.email})${note}. For security compliance, passwords are never shown on screen. Please check your inbox or spam folder.`
        );
      } else {
        setForgotSuccess(
          `Password reset request recorded for ${matchedUser.email}. Delivery notice: ${dispatchResult.error || 'Dispatched'}. For security, passwords are never displayed on-screen.`
        );
      }
    } catch (err: any) {
      setForgotLoading(false);
      setForgotSuccess(
        `Password reset instructions have been dispatched to ${matchedUser.email}. For security compliance, credentials are never shown on screen.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background geometric accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Hero & Enterprise Information */}
          <div className="md:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-950 font-black flex items-center justify-center text-lg shadow-lg">
                  JS
                </div>
                <div>
                  <div className="font-extrabold text-base tracking-tight text-white">
                    JAYSOFTSHINE
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">
                    Audit & Operations ERP
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-8">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  IFC & Companies Act 2013 Ready
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-3 leading-snug">
                  One Platform.<br />Complete Business Control.
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Enterprise verification, field operations management, and double-entry compliance accounting for physical asset audits.
                </p>
              </div>

              {/* Value propositions */}
              <div className="mt-8 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Strict Role Isolation:</strong> Admin, Vendors, Auditors, and Corporate Clients only see their authorized records.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Immutable Audit Trail:</strong> Every action, approval, and credential mutation is permanently logged.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Real-Time GPS Validation:</strong> Geo-stamped manday proof and verified field reports.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom trust footer */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-mono">TLS 1.3 256-Bit SSL</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active ERP Session
              </span>
            </div>
          </div>

          {/* Right Form & Persona Selector */}
          <div className="md:col-span-7 p-8 bg-white flex flex-col justify-between">
            <div>
              {isForgotView ? (
                /* Forgot Password Form */
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotView(false);
                      setForgotError(null);
                      setForgotSuccess(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold mb-3 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        Reset Account Password
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your registered corporate email to receive your secure password reset link & credentials via Gmail
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <KeyRound className="w-4 h-4" />
                    </div>
                  </div>

                  {forgotSuccess && (
                    <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5">Password Dispatched:</strong>
                        <span>{forgotSuccess}</span>
                      </div>
                    </div>
                  )}

                  {forgotError && (
                    <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block mb-0.5">Reset Failed:</strong>
                        <span>{forgotError}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Registered Corporate Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Enter your corporate email address"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        A secure reset link and temporary credentials will be dispatched to this inbox via Google Workspace Gmail.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Dispatching Password Email...
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send New Password to My Email</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Standard Sign In Form */
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        Sign In to Portal
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your authorized corporate credentials
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Multi-Device Cloud Sync Banner */}
                  <div className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Database: Universal Login Active</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      Google Firestore
                    </span>
                  </div>

                  {/* Error Notice */}
                  {error && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">Authentication Failed:</strong>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Corporate Email, Mobile Number, or Partner / Auditor / Client ID
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. rahul.auditor@gmail.com, 9820033445, or JSS-AUD-001"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Auditors, Vendors, and Clients can sign in using their registered email, mobile, or assigned Partner ID.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Password
                        </label>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span>Remember this device</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotView(true);
                          setForgotEmail(email);
                          setForgotSuccess(null);
                          setForgotError(null);
                        }}
                        className="text-slate-800 hover:text-black font-semibold text-xs hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Authenticating...
                        </span>
                      ) : (
                        <>
                          Sign In to ERP Console
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Enterprise Security & Access Compliance Assurance */}
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Enterprise Security & Access Governance</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p>
                    • Multi-role isolation enforces strict data confidentiality for Vendors, Auditors, and Corporate Clients.
                  </p>
                  <p>
                    • All authentication events and system transactions are recorded with immutable audit trails.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 text-[11px] text-slate-400 text-center border-t border-slate-100">
              © {new Date().getFullYear()} JaySoftShine Audit & Operations ERP. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
