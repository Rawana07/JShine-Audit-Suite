import React, { useState } from 'react';
import { Building2, FileText, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { OrganizationProfile, BankDetails } from '../../types/erp';
import { Modal } from './Modal';

interface OrganisationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationProfile;
  onSave: (updatedOrg: OrganizationProfile) => void;
}

export const OrganisationProfileModal: React.FC<OrganisationProfileModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSave,
}) => {
  const [name, setName] = useState(organization.name);
  const [legalName, setLegalName] = useState(organization.legalName);
  const [gstin, setGstin] = useState(organization.gstin);
  const [pan, setPan] = useState(organization.pan);
  const [stateCode, setStateCode] = useState(organization.stateCode);
  const [address, setAddress] = useState(organization.address);
  const [city, setCity] = useState(organization.city);
  const [state, setState] = useState(organization.state);
  const [pincode, setPincode] = useState(organization.pincode);
  const [phone, setPhone] = useState(organization.phone);
  const [email, setEmail] = useState(organization.email);
  const [website, setWebsite] = useState(organization.website || 'https://jaysoftshine.com');

  // Org Bank Details
  const [bankName, setBankName] = useState(organization.bankDetails?.bankName || 'HDFC Bank');
  const [accountHolderName, setAccountHolderName] = useState(
    organization.bankDetails?.accountHolderName || 'JaySoftShine'
  );
  const [accountNumber, setAccountNumber] = useState(organization.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(organization.bankDetails?.ifscCode || '');
  const [branch, setBranch] = useState(organization.bankDetails?.branch || '');
  const [upiId, setUpiId] = useState(organization.bankDetails?.upiId || '');

  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !gstin.trim()) {
      setError('Organisation Name and GSTIN are required.');
      return;
    }

    const updatedBank: BankDetails = {
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      branch: branch.trim(),
      upiId: upiId.trim(),
      pan: pan.trim().toUpperCase(),
    };

    const updatedOrg: OrganizationProfile = {
      name: name.trim(),
      legalName: legalName.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      stateCode: stateCode.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      bankDetails: updatedBank,
    };

    onSave(updatedOrg);
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
      title="Organisation Profile & Statutory Configuration"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {isSaved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Organisation profile & GST details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Brand Banner */}
        <div className="p-4 rounded-xl bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-950 font-black flex items-center justify-center text-base">
              JS
            </div>
            <div>
              <div className="font-bold text-base tracking-tight">{name || 'JaySoftShine'}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                GSTIN: <span className="text-white font-semibold">{gstin || '08BKDPV7945P1Z2'}</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] font-bold">
            Registered Single Entity
          </span>
        </div>

        {/* Statutory Legal Details */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Statutory Legal & GST Identifiers</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organisation Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GSTIN Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="08BKDPV7945P1Z2"
                maxLength={15}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Permanent Account Number (PAN)</label>
              <input
                type="text"
                required
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="BKDPV7945P"
                maxLength={10}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State & GST Code</label>
              <input
                type="text"
                required
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                placeholder="08 (Rajasthan)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Address and Contact Details */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Registered Office & Invoicing Address</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Address Line</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Office, Building, Street"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jay@jaysoftshine.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 XXXXX"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://jaysoftshine.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Organisation Bank Details */}
        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            <span>Organisation Invoicing Bank Account (Printed on Client Tax Invoices)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Beneficiary Name</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="JaySoftShine"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="50200088991122"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0000123"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Jaipur Main Branch"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="jaysoftshine@hdfcbank"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-slate-900 focus:outline-none font-mono"
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
            Save Organisation Profile
          </button>
        </div>
      </form>
    </Modal>
  );
};
