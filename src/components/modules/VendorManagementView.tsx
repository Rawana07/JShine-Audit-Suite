import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Star,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Vendor, VendorBill } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR } from '../../utils/rules';

interface VendorManagementViewProps {
  vendors: Vendor[];
  vendorBills: VendorBill[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
}

export const VendorManagementView: React.FC<VendorManagementViewProps> = ({
  vendors,
  vendorBills,
  onAddVendor,
  onUpdateVendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    contactPerson: '',
    phone: '',
    email: '',
    pan: '',
    gstin: '',
    address: '',
    state: 'Maharashtra',
    bankName: 'HDFC Bank Ltd',
    bankAccount: '',
    bankIfsc: '',
    msmeRegistered: true,
    paymentTermsDays: 15,
    defaultDayRate: 1200,
  });

  const filteredVendors = vendors.filter((v) => {
    return (
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.gstin.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeq = vendors.length + 1;
    const vendorId = `JSS-VND-${String(nextSeq).padStart(3, '0')}`;

    const newVendor: Vendor = {
      id: `vnd_${Date.now()}`,
      vendorId,
      name: form.name,
      legalName: form.legalName || form.name,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      pan: form.pan.toUpperCase(),
      gstin: form.gstin.toUpperCase(),
      address: form.address,
      state: form.state,
      bankName: form.bankName,
      bankAccount: form.bankAccount,
      bankIfsc: form.bankIfsc.toUpperCase(),
      msmeRegistered: Boolean(form.msmeRegistered),
      paymentTermsDays: Number(form.paymentTermsDays),
      defaultDayRate: Number(form.defaultDayRate),
      rating: 5.0,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    onAddVendor(newVendor);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vendor Management</h2>
          <p className="text-xs text-slate-500">
            Outsourcing vendor partners, sub-vendors, MSME compliance status, agreed day rates & banking details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Vendor Partner</span>
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
            placeholder="Search by Vendor Name, ID (JSS-VND-001), GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vendor ID & Legal Name</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Key Contact</th>
                <th className="py-3 px-4">MSME Status</th>
                <th className="py-3 px-4">Agreed Day Rate</th>
                <th className="py-3 px-4">Outstanding Due</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.map((vnd) => {
                const outstandingBills = vendorBills
                  .filter((b) => b.vendorId === vnd.id)
                  .reduce((sum, b) => sum + b.outstanding, 0);

                return (
                  <tr key={vnd.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{vnd.name}</div>
                      <div className="text-[11px] text-slate-500">{vnd.legalName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{vnd.vendorId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-800 font-semibold">{vnd.gstin}</div>
                      <div className="text-slate-400">PAN: {vnd.pan}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{vnd.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{vnd.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {vnd.msmeRegistered ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                          MSME Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                          Non-MSME
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatINR(vnd.defaultDayRate)}/day
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {outstandingBills > 0 ? (
                        <span className="text-rose-600">{formatINR(outstandingBills)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{vnd.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveVendor(vnd)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors"
                      >
                        View Master
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Vendor Partner"
        subtitle="Master record for audit outsourcing vendor"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Apex Audit Solutions LLP"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name</label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                placeholder="Full Registered Entity Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                maxLength={15}
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="27AAXFA9876C1ZB"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN</label>
              <input
                type="text"
                maxLength={10}
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })}
                placeholder="AAXFA9876C"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Managing Partner"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98200 77665"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Day Rate (₹ / Manday)</label>
              <input
                type="number"
                value={form.defaultDayRate}
                onChange={(e) => setForm({ ...form, defaultDayRate: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                value={form.paymentTermsDays}
                onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Office Address"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
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
              Register Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* View Vendor Modal */}
      {activeVendor && (
        <Modal
          isOpen={!!activeVendor}
          onClose={() => setActiveVendor(null)}
          title={`Vendor: ${activeVendor.name}`}
          subtitle={`ID: ${activeVendor.vendorId}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">GSTIN:</span>
                <span className="font-mono font-bold text-slate-900">{activeVendor.gstin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PAN:</span>
                <span className="font-mono font-bold text-slate-900">{activeVendor.pan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank:</span>
                <span className="text-slate-900">{activeVendor.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">A/C:</span>
                <span className="font-mono text-slate-900">{activeVendor.bankAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC:</span>
                <span className="font-mono text-slate-900">{activeVendor.bankIfsc}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Registered Office</span>
              <p className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">{activeVendor.address}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
