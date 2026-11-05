import React, { useState, useEffect } from 'react';
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
  Edit2,
  CreditCard,
  Building2,
  Loader2,
  RefreshCw,
  Globe,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { SmtpConfig, OrganizationProfile } from '../../types/erp';
import { OrganisationProfileModal } from '../common/OrganisationProfileModal';
import { sendTestEmail } from '../../services/emailService';
import {
  signInWithGoogleWorkspace,
  disconnectGoogleWorkspace,
  isGoogleConnected,
  getConnectedGoogleUser,
  subscribeToGoogleAuth,
} from '../../services/googleAuth';

interface SettingsViewProps {
  smtpConfig: SmtpConfig;
  onSaveSmtp: (config: SmtpConfig) => void;
  adminPassword: string;
  onPasswordChange: (newPassword: string) => void;
  organization?: OrganizationProfile;
  onUpdateOrganization?: (org: OrganizationProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  smtpConfig,
  onSaveSmtp,
  adminPassword,
  onPasswordChange,
  organization,
  onUpdateOrganization,
}) => {
  // Google Workspace state
  const [googleConnected, setGoogleConnected] = useState(isGoogleConnected());
  const [googleUser, setGoogleUser] = useState(getConnectedGoogleUser());
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Test Email State
  const [testProbeRecipient, setTestProbeRecipient] = useState('imjayvyas@gmail.com');
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [testingGmail, setTestingGmail] = useState(false);

  // Password Change Form State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Organization Master Modal
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToGoogleAuth((user, token) => {
      setGoogleConnected(!!token && !!user);
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  const activeOrg: OrganizationProfile = organization || {
    name: 'JaySoftShine',
    legalName: 'JaySoftShine Audit & Verification Services',
    gstin: '08BKDPV7945P1Z2',
    pan: 'BKDPV7945P',
    stateCode: '08 (Rajasthan)',
    address: 'Corporate Office, C-Scheme',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    phone: '+91 98200 12345',
    email: 'jay@jaysoftshine.com',
    website: 'https://jaysoftshine.com',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountHolderName: 'JaySoftShine',
      accountNumber: '50200088991122',
      ifscCode: 'HDFC0000123',
      branch: 'Jaipur Main Branch',
      upiId: 'jaysoftshine@hdfcbank',
      pan: 'BKDPV7945P',
    },
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    setGoogleAuthError(null);
    try {
      const result = await signInWithGoogleWorkspace();
      setGoogleConnected(true);
      setGoogleUser(result.user);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setGoogleAuthError(err.message || 'Google Authentication popup was closed or cancelled.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await disconnectGoogleWorkspace();
    setGoogleConnected(false);
    setGoogleUser(null);
  };

  const handleTestGmailConnection = async () => {
    if (!testProbeRecipient || !testProbeRecipient.includes('@')) {
      setTestEmailResult({
        success: false,
        message: 'Please provide a valid destination email address for the test probe.',
      });
      return;
    }

    setTestingGmail(true);
    setTestEmailResult(null);

    try {
      const res = await sendTestEmail(testProbeRecipient.trim());
      if (res.success) {
        setTestEmailResult({
          success: true,
          message: `Live test email dispatched successfully via Google Workspace Gmail!`,
          details: `Message ID: ${res.messageId || 'Delivered'} • Sender: ${res.senderEmail || 'imjayvyas@gmail.com'} • Recipient: ${testProbeRecipient}. Please check your inbox or spam folder.`,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: `Dispatch notice: ${res.error || 'Please connect your Google Workspace account.'}`,
          details: 'Click "Sign in with Google" below to grant permissions to send transactional emails directly from your Gmail account.',
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: `Dispatch error: ${err.message}`,
      });
    } finally {
      setTestingGmail(false);
    }
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
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Settings & Gateway Gateway</h2>
        <p className="text-xs text-slate-500">
          Google Workspace Gmail delivery, Master administrator credentials, Organization profile & statutory configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Workspace Gmail Configuration Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold border border-red-200">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Workspace Gmail Gateway</h3>
                <p className="text-[11px] text-slate-500">Official Gmail REST API Integration (OAuth 2.0)</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                googleConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {googleConnected ? 'OAUTH CONNECTED' : 'AWAITING SIGN-IN'}
            </span>
          </div>

          {/* Connection Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Google Account Status:</span>
              <span className="flex items-center gap-1.5 font-bold font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    googleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={googleConnected ? 'text-emerald-700' : 'text-slate-600'}>
                  {googleConnected ? (googleUser?.email || 'imjayvyas@gmail.com') : 'Not Signed In'}
                </span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              Transactional emails (Welcome credentials, Password Resets, Tax & GST notices) are dispatched directly using the official <strong>Google Workspace Gmail REST API</strong> with client-side OAuth security.
            </div>

            {googleAuthError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{googleAuthError}</span>
              </div>
            )}

            {/* Google Action Button */}
            {googleConnected ? (
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Active Gmail OAuth Session
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3 h-3 text-slate-500" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isConnectingGoogle ? 'Authorizing Google Account...' : 'Sign in with Google (Connect Gmail)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Test Probe Output */}
          {testEmailResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testEmailResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {testEmailResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold">{testEmailResult.message}</div>
                {testEmailResult.details && (
                  <div className="text-[11px] opacity-90 font-mono break-all">{testEmailResult.details}</div>
                )}
              </div>
            </div>
          )}

          {/* Live Test Probe Box */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Send Live Test Probe via Gmail</span>
              <span className="text-[10px] font-mono text-slate-400">REST API v1</span>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">
                Destination Recipient Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testProbeRecipient}
                  onChange={(e) => setTestProbeRecipient(e.target.value)}
                  placeholder="imjayvyas@gmail.com"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestGmailConnection}
                  disabled={testingGmail}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {testingGmail ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Probe
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Dispatches an authentic test email to confirm Google Workspace Gmail connectivity and message delivery.
            </p>
          </div>
        </div>

        {/* Right Column: Organization Master & Admin Credentials */}
        <div className="space-y-6">
          {/* Company Master Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Organization Profile & Master Entity</h3>
                  <p className="text-[11px] text-slate-500">JaySoftShine Indian Statutory Configuration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Organization Name</span>
                <span className="font-bold text-slate-900 text-sm">{activeOrg.name}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">GSTIN</span>
                <span className="font-bold font-mono text-slate-900 text-sm">{activeOrg.gstin}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">PAN</span>
                <span className="font-bold font-mono text-slate-900 text-sm">{activeOrg.pan}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">State Jurisdiction</span>
                <span className="font-semibold text-slate-800">{activeOrg.stateCode || '08 (Rajasthan)'}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Registered Office: </span>
              {activeOrg.address}, {activeOrg.city}, {activeOrg.state} - {activeOrg.pincode}
            </div>
          </div>

          {/* Change Super Admin Password Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Super Administrator Password</h3>
                <p className="text-[11px] text-slate-500">Update master sign-in credential for Jayesh Vyas</p>
              </div>
            </div>

            {pwSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Super Administrator password updated successfully!</span>
              </div>
            )}

            {pwError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Master Password</label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-950 hover:bg-black text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer mt-2"
              >
                Update Master Password
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Organization Edit Modal */}
      {isOrgModalOpen && (
        <OrganisationProfileModal
          isOpen={isOrgModalOpen}
          onClose={() => setIsOrgModalOpen(false)}
          organization={activeOrg}
          onSave={(updated) => {
            if (onUpdateOrganization) {
              onUpdateOrganization(updated);
            }
            setIsOrgModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
