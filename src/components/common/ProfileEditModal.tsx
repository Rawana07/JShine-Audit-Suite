import React, { useState } from 'react';
import { User, Phone, MapPin, Building, CreditCard, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { UserProfile, BankDetails } from '../../types/erp';
import { Modal } from './Modal';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>, bankDetails: BankDetails) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');

  // Bank Details state
  const [bankName, setBankName] = useState(currentUser.bankDetails?.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(
    currentUser.bankDetails?.accountHolderName || currentUser.name
  );
  const [accountNumber, setAccountNumber] = useState(currentUser.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(currentUser.bankDetails?.ifscCode || '');
  const [branch, setBranch] = useState(currentUser.bankDetails?.branch || '');
  const [upiId, setUpiId] = useState(currentUser.bankDetails?.upiId || '');
  const [pan, setPan] = useState(currentUser.bankDetails?.pan || '');

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const bankDetails: BankDetails = {
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim() || name.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      branch: branch.trim(),
      upiId: upiId.trim(),
      pan: pan.trim().toUpperCase(),
    };

    onSave(
      {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        bankDetails,
      },
      bankDetails
    );

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Profile & Banking Information"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {isSaved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Profile & bank credentials updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* User Account Overview */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">{currentUser.email}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
              {currentUser.role}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Verified ERP User</div>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>Personal & Contact Information</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name / Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 XXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office / Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, State, Pincode"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            <span>Bank Account Details (Payouts & Disbursements)</span>
          </h4>
          <p className="text-[11px] text-slate-500 mb-3">
            Mandays, vendor bill reimbursements, and auditor settlements are directly wired to this verified bank account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank / ICICI Bank / SBI"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name as per Bank Passbook"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account number"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0000123"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Dadar West / Jaipur Main"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">UPI ID (Optional)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. username@okhdfcbank"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                className="w-full sm:w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-950 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Save Profile & Banking Details
          </button>
        </div>
      </form>
    </Modal>
  );
};
