import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  Receipt,
  FileText,
} from 'lucide-react';
import { Client } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeClientDetail, setActiveClientDetail] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    clientType: 'MNC' as Client['clientType'],
    pan: '',
    gstin: '',
    registeredAddress: '',
    billingAddress: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    paymentTermsDays: 30,
    tdsRatePercent: 2,
    creditLimit: 2000000,
    notes: '',
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || c.clientType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNumber = clients.length + 1;
    const clientId = `JSS-CLI-${String(nextNumber).padStart(3, '0')}`;

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      clientId,
      name: formData.name,
      clientType: formData.clientType,
      pan: formData.pan.toUpperCase(),
      gstin: formData.gstin.toUpperCase(),
      registeredAddress: formData.registeredAddress,
      billingAddress: formData.billingAddress || formData.registeredAddress,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      paymentTermsDays: Number(formData.paymentTermsDays),
      tdsRatePercent: Number(formData.tdsRatePercent),
      creditLimit: Number(formData.creditLimit),
      status: 'Active',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    onAddClient(newClient);
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      clientType: 'MNC',
      pan: '',
      gstin: '',
      registeredAddress: '',
      billingAddress: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      paymentTermsDays: 30,
      tdsRatePercent: 2,
      creditLimit: 2000000,
      notes: '',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">CRM & Client Master</h2>
          <p className="text-xs text-slate-500">
            Enterprise clients, MNCs, Big Four and CA accounting firms with contract rates & GST/TDS rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Client Name, ID (JSS-CLI-001), GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">All Client Types</option>
            <option value="MNC">MNC</option>
            <option value="Big Four Firm">Big Four Firm</option>
            <option value="CA Firm">CA Firm</option>
            <option value="Corporate">Corporate</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Pharmaceutical">Pharmaceutical</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Client ID & Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">PAN & GSTIN</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Key Contact</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{client.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{client.clientId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-800">
                      {client.clientType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-800 font-semibold">{client.gstin}</div>
                    <div className="text-slate-400">PAN: {client.pan}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{client.city}, {client.state}</div>
                    <div className="text-[10px] text-slate-400">{client.pincode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{client.contactPerson}</div>
                    <div className="text-[11px] text-slate-500">{client.contactEmail}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                    <div>{client.paymentTermsDays} Days Net</div>
                    <div className="text-slate-400">TDS: {client.tdsRatePercent}%</div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={client.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveClientDetail(client)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors"
                    >
                      View Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Enterprise Client"
        subtitle="Configure client master profile, tax identification and payment terms"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Hindustan Unilever Ltd"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.clientType}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="MNC">MNC</option>
                <option value="Big Four Firm">Big Four Firm</option>
                <option value="CA Firm">CA Firm</option>
                <option value="Corporate">Corporate</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Pharmaceutical">Pharmaceutical</option>
                <option value="Financial Institution">Financial Institution</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="e.g. 27AAACH1234F1Z8"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                placeholder="e.g. AAACH1234F"
                className="w-full font-mono uppercase rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Office Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                placeholder="Full address for invoicing and legal compliance"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Audit Lead / VP Commercial"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="commercial@client.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TDS Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tdsRatePercent}
                onChange={(e) => setFormData({ ...formData, tdsRatePercent: Number(e.target.value) })}
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
              Save Client Master
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Detail View Modal */}
      {activeClientDetail && (
        <Modal
          isOpen={!!activeClientDetail}
          onClose={() => setActiveClientDetail(null)}
          title={`Client: ${activeClientDetail.name}`}
          subtitle={`ID: ${activeClientDetail.clientId} • Type: ${activeClientDetail.clientType}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">GSTIN</span>
                <span className="font-mono font-bold text-slate-900">{activeClientDetail.gstin}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">PAN</span>
                <span className="font-mono font-bold text-slate-900">{activeClientDetail.pan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Credit Limit</span>
                <span className="font-bold text-slate-900">{formatINR(activeClientDetail.creditLimit)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Payment Terms</span>
                <span className="font-semibold text-slate-900">{activeClientDetail.paymentTermsDays} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">TDS Rate</span>
                <span className="font-semibold text-slate-900">{activeClientDetail.tdsRatePercent}% (Sec 194C/J)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Status</span>
                <StatusBadge status={activeClientDetail.status} size="sm" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Billing & Registered Address</h4>
              <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                {activeClientDetail.billingAddress}, {activeClientDetail.city}, {activeClientDetail.state} - {activeClientDetail.pincode}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Key Commercial Contact</h4>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{activeClientDetail.contactPerson}</div>
                  <div className="text-slate-500">{activeClientDetail.contactEmail} • {activeClientDetail.contactPhone}</div>
                </div>
              </div>
            </div>

            {activeClientDetail.notes && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Audit Notes & Instructions</h4>
                <p className="text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                  {activeClientDetail.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
