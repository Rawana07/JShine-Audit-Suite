import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Award,
  CheckCircle2,
  Calendar,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Auditor } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR } from '../../utils/rules';

interface WorkforceAuditorsViewProps {
  auditors: Auditor[];
  onAddAuditor: (auditor: Auditor, loginPassword?: string) => void;
  onUpdateAuditor: (auditor: Auditor) => void;
}

export const WorkforceAuditorsView: React.FC<WorkforceAuditorsViewProps> = ({
  auditors,
  onAddAuditor,
  onUpdateAuditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAuditor, setActiveAuditor] = useState<Auditor | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Jshine@2329',
    address: '',
    pan: '',
    bankName: 'HDFC Bank',
    bankAccount: '',
    bankIfsc: '',
    skills: 'Physical Verification, Stock Audit, Asset Tagging',
    experienceYears: 3,
    preferredStates: 'Maharashtra, Gujarat',
    defaultDayRate: 1000,
    travelAllowancePerKm: 5,
    dailyFoodAllowance: 300,
  });

  const filteredAuditors = auditors.filter((a) => {
    return (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.auditorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone.includes(searchTerm) ||
      a.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeq = auditors.length + 1;
    const auditorId = `JSS-AUD-${String(nextSeq).padStart(3, '0')}`;

    const newAuditor: Auditor = {
      id: `aud_${Date.now()}`,
      auditorId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      pan: form.pan.toUpperCase(),
      bankName: form.bankName,
      bankAccount: form.bankAccount,
      bankIfsc: form.bankIfsc.toUpperCase(),
      skills: form.skills.split(',').map((s) => s.trim()),
      experienceYears: Number(form.experienceYears),
      preferredStates: form.preferredStates.split(',').map((s) => s.trim()),
      defaultDayRate: Number(form.defaultDayRate),
      travelAllowancePerKm: Number(form.travelAllowancePerKm),
      dailyFoodAllowance: Number(form.dailyFoodAllowance),
      isAvailable: true,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    onAddAuditor(newAuditor, form.password || 'Jshine@2329');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Workforce / Auditor Database</h2>
          <p className="text-xs text-slate-500">
            Certified field verification auditors, daily payout rates, travel allowances & KYC banking records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Auditor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Auditor Name, ID (JSS-AUD-001), Skills..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Auditors Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Auditor ID & Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Specialization Skills</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Standard Day Rate</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuditors.map((aud) => (
                <tr key={aud.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{aud.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{aud.auditorId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{aud.phone}</div>
                    <div className="text-[11px] text-slate-400">{aud.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {aud.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {aud.experienceYears} Years
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatINR(aud.defaultDayRate)}/day
                  </td>
                  <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                    <div>TA: ₹{aud.travelAllowancePerKm}/km</div>
                    <div>Food: ₹{aud.dailyFoodAllowance}/day</div>
                  </td>
                  <td className="py-3 px-4">
                    {aud.isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <XCircle className="w-3.5 h-3.5" /> On Field
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveAuditor(aud)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors"
                    >
                      View KYC
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Auditor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Certified Auditor to Workforce Master"
        subtitle="Configure daily remuneration, allowances, and KYC bank details"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Auditor Full Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="auditor@gmail.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card</label>
              <input
                type="text"
                maxLength={10}
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })}
                placeholder="ABCDE1234F"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Portal Login Password</label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let code = '';
                    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                    setForm({ ...form, password: `JSS#${code}!${Math.floor(100 + Math.random() * 900)}` });
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Portal login password"
                  className="w-full font-mono rounded-lg border border-slate-300 pl-3 pr-8 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Day Rate (₹ / Day)</label>
              <input
                type="number"
                value={form.defaultDayRate}
                onChange={(e) => setForm({ ...form, defaultDayRate: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (Comma-separated)</label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="Physical Verification, Stock Audit, Asset Tagging, SAP"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                placeholder="Account number"
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                placeholder="HDFC0000123"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Save Auditor Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Auditor KYC Details Modal */}
      {activeAuditor && (
        <Modal
          isOpen={!!activeAuditor}
          onClose={() => setActiveAuditor(null)}
          title={`Auditor Profile: ${activeAuditor.name}`}
          subtitle={`ID: ${activeAuditor.auditorId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">PAN:</span>
                <span className="font-mono font-bold text-slate-900">{activeAuditor.pan || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Day Rate:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(activeAuditor.defaultDayRate)}/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank:</span>
                <span className="text-slate-900">{activeAuditor.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">A/C Number:</span>
                <span className="font-mono text-slate-900">{activeAuditor.bankAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC:</span>
                <span className="font-mono text-slate-900">{activeAuditor.bankIfsc}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Residential Address</span>
              <p className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">{activeAuditor.address}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
