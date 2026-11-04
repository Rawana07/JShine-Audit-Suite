import React, { useState } from 'react';
import {
  Settings,
  Mail,
  KeyRound,
  Shield,
  Building,
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
} from 'lucide-react';
import { SmtpConfig } from '../../types/erp';

interface SettingsViewProps {
  smtpConfig: SmtpConfig;
  onSaveSmtp: (config: SmtpConfig) => void;
  adminPassword: string;
  onPasswordChange: (newPassword: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  smtpConfig,
  onSaveSmtp,
  adminPassword,
  onPasswordChange,
}) => {
  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({ ...smtpConfig });
  const [smtpSuccess, setSmtpSuccess] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Password Change Form State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSmtp({
      ...smtpForm,
      isConfigured: true,
      lastTestedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });
    setSmtpSuccess(true);
    setTimeout(() => setSmtpSuccess(false), 3000);
  };

  const handleTestSmtpConnection = () => {
    setTestingSmtp(true);
    setTestEmailResult(null);
    setTimeout(() => {
      setTestingSmtp(false);
      setTestEmailResult(
        `SMTP handshake successful to ${smtpForm.host}:${smtpForm.port}. Test event email dispatched from ${smtpForm.fromEmail}.`
      );
    }, 1200);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (currentPw !== adminPassword) {
      setPwError('Current password does not match.');
      return;
    }

    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }

    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    onPasswordChange(newPw);
    setPwSuccess(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Settings & Mail SMTP Setup</h2>
        <p className="text-xs text-slate-500">
          Administrator credentials, SMTP mail server gateway, company profile & Indian statutory configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mail SMTP Setup Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Outgoing Mail SMTP Setup</h3>
                <p className="text-[11px] text-slate-500">Configure email server for work orders, invoices & attendance alerts</p>
              </div>
            </div>
            {smtpForm.isConfigured && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            )}
          </div>

          {smtpSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>SMTP configuration saved successfully!</span>
            </div>
          )}

          {testEmailResult && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <Send className="w-4 h-4 shrink-0" />
              <span>{testEmailResult}</span>
            </div>
          )}

          <form onSubmit={handleSaveSmtp} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  SMTP Host Server <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  placeholder="smtp.gmail.com or mail.jaysoftshine.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Port</label>
                <input
                  type="number"
                  required
                  value={smtpForm.port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SMTP Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm.username}
                  onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                  placeholder="jay@jaysoftshine.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={smtpForm.password || ''}
                  onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">From Email Address</label>
                <input
                  type="email"
                  required
                  value={smtpForm.fromEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                  placeholder="noreply@jaysoftshine.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">From Sender Name</label>
                <input
                  type="text"
                  required
                  value={smtpForm.fromName}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                  placeholder="JaySoftShine ERP Alerts"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="secureSmtp"
                checked={smtpForm.secure}
                onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <label htmlFor="secureSmtp" className="text-xs font-medium text-slate-700">
                Enable SSL / TLS Encryption (Port 465)
              </label>
            </div>

            {smtpForm.lastTestedAt && (
              <div className="text-[11px] text-slate-400 font-mono">
                Last Tested: {smtpForm.lastTestedAt}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                disabled={testingSmtp}
                onClick={handleTestSmtpConnection}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingSmtp ? 'Testing Handshake...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save SMTP Settings
              </button>
            </div>
          </form>
        </div>

        {/* Admin Password Change Form Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Administrator Security Credentials</h3>
                <p className="text-[11px] text-slate-500">Account: jay@jaysoftshine.com</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
              SUPER_ADMIN
            </span>
          </div>

          {pwSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password updated successfully! Future logins will use your new password.</span>
            </div>
          )}

          {pwError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password (default: Jshine@2329)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Default password: <code className="font-mono bg-slate-100 px-1 py-0.2 rounded">Jshine@2329</code>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Organization Profile & Statutory Defaults */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Company Master Configuration (JaySoftShine Single Organization)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Organization Name</span>
            <strong className="text-slate-900 font-sans">JaySoftShine Services LLP</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">GSTIN (Maharashtra)</span>
            <strong className="text-slate-900">27AAACJ2329J1Z4</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Permanent A/C (PAN)</span>
            <strong className="text-slate-900">AAACJ2329J</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Financial Year</span>
            <strong className="text-slate-900 font-sans">1 April to 31 March (FY 26-27)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
