import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Assignment, Project, ProjectLocation, Auditor, Vendor } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';

interface AssignmentsViewProps {
  assignments: Assignment[];
  projects: Project[];
  locations: ProjectLocation[];
  auditors: Auditor[];
  vendors: Vendor[];
  onAddAssignment: (assignment: Assignment, allocatedLocationIds: string[]) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  projects,
  locations,
  auditors,
  vendors,
  onAddAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [printWorkOrder, setPrintWorkOrder] = useState<Assignment | null>(null);

  // Wizard Multi-Step Form State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [executionType, setExecutionType] = useState<'DIRECT' | 'VENDOR'>('DIRECT');
  const [assignedResourceId, setAssignedResourceId] = useState<string>('');
  const [clientRate, setClientRate] = useState<number>(1500);
  const [executionRate, setExecutionRate] = useState<number>(1000);
  const [plannedStartDate, setPlannedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [instructions, setInstructions] = useState('');

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Locations for the selected project
  const projectLocations = locations.filter((l) => l.projectId === selectedProjectId);
  const availableLocations = projectLocations.filter((l) => l.status === 'Unallocated' || l.status === 'Allocated');

  const filteredAssignments = assignments.filter((a) => {
    return (
      a.assignmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const toggleLocationSelect = (locId: string) => {
    if (selectedLocationIds.includes(locId)) {
      setSelectedLocationIds(selectedLocationIds.filter((id) => id !== locId));
    } else {
      setSelectedLocationIds([...selectedLocationIds, locId]);
    }
  };

  const handleCreateAssignment = () => {
    const nextSeq = assignments.length + 1;
    const assignmentId = `JSS-ASN-2026-${String(nextSeq).padStart(3, '0')}`;

    const totalMandays = selectedLocationIds.length || 1;
    const estRevenue = totalMandays * clientRate;
    const estCost = totalMandays * executionRate;
    const estMargin = estRevenue - estCost;

    let resourceName = 'Resource';
    if (executionType === 'DIRECT') {
      const aud = auditors.find((a) => a.id === assignedResourceId) || auditors[0];
      resourceName = aud ? aud.name : 'Direct Auditor';
    } else {
      const vnd = vendors.find((v) => v.id === assignedResourceId) || vendors[0];
      resourceName = vnd ? vnd.name : 'Vendor Partner';
    }

    const newAssignment: Assignment = {
      id: `asn_${Date.now()}`,
      assignmentId,
      projectId: currentProject.id,
      projectName: currentProject.name,
      locationIds: selectedLocationIds,
      executionType,
      assignedToId: assignedResourceId || (executionType === 'DIRECT' ? auditors[0]?.id : vendors[0]?.id),
      assignedToName: resourceName,
      assignedDate: new Date().toISOString().split('T')[0],
      plannedStartDate,
      plannedEndDate,
      expectedMandays: totalMandays,
      clientRateSnapshot: clientRate,
      executionRateSnapshot: executionRate,
      estimatedRevenue: estRevenue,
      estimatedCost: estCost,
      estimatedMargin: estMargin,
      instructions,
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString(),
    };

    onAddAssignment(newAssignment, selectedLocationIds);
    setIsWizardOpen(false);
    setWizardStep(1);
    setSelectedLocationIds([]);
    setInstructions('');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Assignment Allocation Engine</h2>
          <p className="text-xs text-slate-500">
            Allocate locations to individual auditors or outsourcing vendors with locked rate snapshots and official work orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsWizardOpen(true);
            setWizardStep(1);
            if (currentProject) {
              setClientRate(currentProject.clientRatePerManday || 1500);
            }
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment Wizard</span>
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
            placeholder="Search by Assignment ID (JSS-ASN-2026-001), Project, Resource..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Assignment ID</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Allocated Resource</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Sites</th>
                <th className="py-3 px-4">Client Rate</th>
                <th className="py-3 px-4">Execution Cost</th>
                <th className="py-3 px-4">Est. Margin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Work Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((asn) => (
                <tr key={asn.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div>{asn.assignmentId}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{asn.assignedDate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{asn.projectName}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatDateIndian(asn.plannedStartDate)} to {formatDateIndian(asn.plannedEndDate)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{asn.assignedToName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      asn.executionType === 'DIRECT' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {asn.executionType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {asn.locationIds.length || 1} Sites ({asn.expectedMandays} Mandays)
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatINR(asn.clientRateSnapshot)}/day
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {formatINR(asn.executionRateSnapshot)}/day
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {formatINR(asn.estimatedMargin)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={asn.approvalStatus} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPrintWorkOrder(asn)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Work Order</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Step Assignment Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Assignment Creation Wizard"
        subtitle={`Step ${wizardStep} of 4: ${
          wizardStep === 1
            ? 'Select Project & Locations'
            : wizardStep === 2
            ? 'Execution Model & Resource Allocation'
            : wizardStep === 3
            ? 'Commercial Rate Snapshots & Schedule'
            : 'Review & Work Order Generation'
        }`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full ${
                  wizardStep >= step ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              ></div>
            ))}
          </div>

          {/* Step 1: Select Project & Locations */}
          {wizardStep === 1 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Select Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    const p = projects.find((x) => x.id === e.target.value);
                    if (p) setClientRate(p.clientRatePerManday || 1500);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectId} - {p.name} ({p.executionModel} Model)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Select Project Sites to Allocate ({selectedLocationIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLocationIds.length === availableLocations.length) {
                        setSelectedLocationIds([]);
                      } else {
                        setSelectedLocationIds(availableLocations.map((l) => l.id));
                      }
                    }}
                    className="text-xs text-slate-900 font-semibold hover:underline"
                  >
                    {selectedLocationIds.length === availableLocations.length ? 'Deselect All' : 'Select All Available'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {availableLocations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No unallocated locations found for this project.
                    </div>
                  ) : (
                    availableLocations.map((loc) => {
                      const isSelected = selectedLocationIds.includes(loc.id);
                      return (
                        <div
                          key={loc.id}
                          onClick={() => toggleLocationSelect(loc.id)}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-slate-900"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{loc.siteName}</div>
                              <div className="text-[11px] text-slate-500 font-normal">
                                {loc.locationId} • {loc.city}, {loc.state} ({loc.pincode})
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-slate-600 text-xs">{formatINR(loc.clientBillingRate)}/day</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={selectedLocationIds.length === 0}
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Next: Choose Resource & Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Resource Allocation & Execution Type */}
          {wizardStep === 2 && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Execution Channel <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setExecutionType('DIRECT');
                      setExecutionRate(1000);
                      setAssignedResourceId(auditors[0]?.id || '');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      executionType === 'DIRECT'
                        ? 'border-slate-900 bg-slate-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Direct Individual Auditor
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Allocate directly to certified in-house or outsourced individual auditor (Standard rate ₹1,000/day).
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setExecutionType('VENDOR');
                      setExecutionRate(1200);
                      setAssignedResourceId(vendors[0]?.id || '');
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      executionType === 'VENDOR'
                        ? 'border-slate-900 bg-slate-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      Vendor Outsourcing Package
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Outsource entire batch to a vendor partner (e.g. Apex Audit Solutions @ ₹1,200/day).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign to {executionType === 'DIRECT' ? 'Auditor' : 'Vendor'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedResourceId}
                  onChange={(e) => setAssignedResourceId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none bg-white"
                >
                  {executionType === 'DIRECT'
                    ? auditors.map((aud) => (
                        <option key={aud.id} value={aud.id}>
                          {aud.name} ({aud.auditorId}) - Day Rate: ₹{aud.defaultDayRate} • {aud.skills.slice(0, 2).join(', ')}
                        </option>
                      ))
                    : vendors.map((vnd) => (
                        <option key={vnd.id} value={vnd.id}>
                          {vnd.name} ({vnd.vendorId}) - Day Rate: ₹{vnd.defaultDayRate} • {vnd.state}
                        </option>
                      ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  <span>Next: Rates & Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Commercial Rates & Schedule */}
          {wizardStep === 3 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Rate Snapshot (₹ / Manday) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={clientRate}
                    onChange={(e) => setClientRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Rate billed to client for this assignment</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Execution Cost Snapshot (₹ / Manday) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={executionRate}
                    onChange={(e) => setExecutionRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Agreed payout to auditor or vendor</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Start Date</label>
                  <input
                    type="date"
                    value={plannedStartDate}
                    onChange={(e) => setPlannedStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planned End Date</label>
                  <input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignment Instructions & Work Order Scope
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="E.g., Conduct 100% physical count of tea bags & coffee boxes, photograph damaged pallets, get store keeper counter-signature..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  <span>Review & Lock Commercials</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Generate */}
          {wizardStep === 4 && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 text-white space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Total Sites Allocated:</span>
                  <span className="font-bold text-white">{selectedLocationIds.length} Locations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected Client Revenue:</span>
                  <span className="font-bold text-white">{formatINR(selectedLocationIds.length * clientRate)}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>(-) Direct Execution Cost:</span>
                  <span>-{formatINR(selectedLocationIds.length * executionRate)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-emerald-400 font-bold text-sm">
                  <span>(=) Estimated Gross Margin:</span>
                  <span>
                    {formatINR(selectedLocationIds.length * (clientRate - executionRate))} (
                    {clientRate > 0 ? (((clientRate - executionRate) / clientRate) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Commercial rates will be locked in this assignment record. Changing client master rate cards in future will never alter these historical agreed execution rates.
              </p>

              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateAssignment}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Generate Assignment & Work Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Printable Work Order Modal */}
      {printWorkOrder && (
        <Modal
          isOpen={!!printWorkOrder}
          onClose={() => setPrintWorkOrder(null)}
          title={`Official Work Order: ${printWorkOrder.assignmentId}`}
          subtitle="JaySoftShine Audit & Operations ERP Document"
          maxWidth="4xl"
        >
          <div className="printable-document p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-xs text-slate-800 font-sans">
            {/* Work order header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">JAYSOFTSHINE</h1>
                <p className="text-[11px] text-slate-600 font-medium">Audit & Operations Outsourcing Division</p>
                <p className="text-[10px] text-slate-500">
                  GSTIN: 08BKDPV7945P1Z2 • PAN: BKDPV7945P • Jaipur, Rajasthan
                </p>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-slate-950">ASSIGNMENT WORK ORDER</div>
                <div className="font-mono text-xs font-bold text-slate-800">{printWorkOrder.assignmentId}</div>
                <div className="text-[11px] text-slate-500">Date: {formatDateIndian(printWorkOrder.assignedDate)}</div>
              </div>
            </div>

            {/* Allocated To Box */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Allocated Partner / Auditor</span>
                <strong className="text-sm text-slate-950">{printWorkOrder.assignedToName}</strong>
                <div className="text-[11px] text-slate-600">Execution Channel: {printWorkOrder.executionType}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Project & Scope</span>
                <strong className="text-sm text-slate-950">{printWorkOrder.projectName}</strong>
                <div className="text-[11px] text-slate-600">
                  Schedule: {formatDateIndian(printWorkOrder.plannedStartDate)} to {formatDateIndian(printWorkOrder.plannedEndDate)}
                </div>
              </div>
            </div>

            {/* Commercial terms */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Agreed Commercial Terms</h3>
              <table className="w-full text-left border border-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Description</th>
                    <th className="p-2">Sites / Locations</th>
                    <th className="p-2">Expected Mandays</th>
                    <th className="p-2">Agreed Payout Rate</th>
                    <th className="p-2 text-right">Total Execution Payout</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 font-medium">Physical Stock Verification & Asset Tagging Audit</td>
                    <td className="p-2">{printWorkOrder.locationIds.length || 1} Sites</td>
                    <td className="p-2 font-mono">{printWorkOrder.expectedMandays} Mandays</td>
                    <td className="p-2 font-mono">{formatINR(printWorkOrder.executionRateSnapshot)} / Manday</td>
                    <td className="p-2 font-mono font-bold text-right">{formatINR(printWorkOrder.estimatedCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            {printWorkOrder.instructions && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Operational Guidelines & Execution Instructions:</h4>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] leading-relaxed">
                  {printWorkOrder.instructions}
                </p>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <div className="font-bold text-slate-900">Authorized Signatory</div>
                <div className="text-[10px] text-slate-500">JaySoftShine Operations Head</div>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <div className="font-bold text-slate-900">Partner / Auditor Acceptance</div>
                <div className="text-[10px] text-slate-500">Acknowledged & Accepted by {printWorkOrder.assignedToName}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="no-print pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
