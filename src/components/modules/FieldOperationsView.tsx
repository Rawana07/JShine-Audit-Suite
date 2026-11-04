import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Camera,
  CheckCircle2,
  FileCheck2,
  Upload,
  AlertTriangle,
  Building,
  UserCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { WorkReport, ProjectLocation, Project, Auditor } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatDateIndian } from '../../utils/rules';

interface FieldOperationsViewProps {
  reports: WorkReport[];
  locations: ProjectLocation[];
  projects: Project[];
  auditors: Auditor[];
  onAddReport: (report: WorkReport) => void;
  onUpdateLocationStatus: (locationId: string, status: ProjectLocation['status']) => void;
}

export const FieldOperationsView: React.FC<FieldOperationsViewProps> = ({
  reports,
  locations,
  projects,
  auditors,
  onAddReport,
  onUpdateLocationStatus,
}) => {
  const [activeReportCategory, setActiveReportCategory] = useState<string>('Physical Verification');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<WorkReport | null>(null);

  // Form State
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    locationId: locations[0]?.id || '',
    category: 'Physical Verification' as WorkReport['category'],
    auditorName: auditors[0]?.name || 'Rahul Sharma',
    totalAssetsCounted: 1250,
    discrepanciesFound: 2,
    physicalConditionNotes: 'Warehouse inventory verified against stock sheets. All aisles checked.',
    photoUrl1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    photoUrl2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
  });

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === form.projectId) || projects[0];
    const loc = locations.find((l) => l.id === form.locationId) || locations[0];

    const nextSeq = reports.length + 1;
    const reportId = `JSS-REP-2026-${String(nextSeq).padStart(3, '0')}`;

    const newReport: WorkReport = {
      id: `rep_${Date.now()}`,
      reportId,
      projectId: proj.id,
      projectName: proj.name,
      locationId: loc.id,
      locationName: loc.siteName,
      category: form.category,
      submittedBy: form.auditorName,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      totalAssetsCounted: Number(form.totalAssetsCounted),
      discrepanciesFound: Number(form.discrepanciesFound),
      physicalConditionNotes: form.physicalConditionNotes,
      photoUrls: [form.photoUrl1, form.photoUrl2].filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    onAddReport(newReport);
    onUpdateLocationStatus(loc.id, 'Completed');
    setIsSubmitModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Field Operations & Work Reports</h2>
          <p className="text-xs text-slate-500">
            Physical verification audits, inventory counts, barcode asset tagging & site evidence capture.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Submit Site Audit Report</span>
        </button>
      </div>

      {/* Field Inspection Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          'Physical Verification',
          'Stock Audit',
          'Fixed Asset Verification',
          'Asset Tagging',
          'Internal Audit',
          'Insurance Survey',
        ].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveReportCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeReportCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports
          .filter((r) => activeReportCategory === 'ALL' || r.category === activeReportCategory)
          .map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  {rep.photoUrls && rep.photoUrls.length > 0 ? (
                    <img
                      src={rep.photoUrls[0]}
                      alt="Site"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Camera className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="font-mono text-[10px] font-bold bg-slate-950/80 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {rep.reportId}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={rep.status} size="sm" />
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{rep.locationName}</h3>
                    <div className="text-[11px] text-slate-500 truncate">{rep.projectName}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Verified Count:</span>
                      <strong className="text-slate-900">{rep.totalAssetsCounted || 0} Units</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Discrepancies:</span>
                      <strong className={rep.discrepanciesFound ? 'text-amber-600' : 'text-emerald-600'}>
                        {rep.discrepanciesFound || 0} Notes
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {rep.physicalConditionNotes || 'No anomalies recorded during site physical count.'}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
                <div>By: <strong className="text-slate-800">{rep.submittedBy}</strong></div>
                <button
                  type="button"
                  onClick={() => setSelectedReportDetail(rep)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Submit Report Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Field Audit Report"
        subtitle="Capture physical stock counts, asset verification and photographic evidence"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectId} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.locationId} - {l.siteName} ({l.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                <option value="Physical Verification">Physical Verification</option>
                <option value="Stock Audit">Stock Audit</option>
                <option value="Fixed Asset Verification">Fixed Asset Verification</option>
                <option value="Asset Tagging">Asset Tagging</option>
                <option value="Internal Audit">Internal Audit</option>
                <option value="Insurance Survey">Insurance Survey</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Auditor Name</label>
              <input
                type="text"
                required
                value={form.auditorName}
                onChange={(e) => setForm({ ...form, auditorName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Assets / Units Counted</label>
              <input
                type="number"
                value={form.totalAssetsCounted}
                onChange={(e) => setForm({ ...form, totalAssetsCounted: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discrepancies / Damage Count</label>
              <input
                type="number"
                value={form.discrepanciesFound}
                onChange={(e) => setForm({ ...form, discrepanciesFound: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition & Observation Notes</label>
              <textarea
                rows={2}
                value={form.physicalConditionNotes}
                onChange={(e) => setForm({ ...form, physicalConditionNotes: e.target.value })}
                placeholder="Physical condition, damaged boxes, tags adhered, discrepancy details..."
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Submit Report & Update Location Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Detail Modal */}
      {selectedReportDetail && (
        <Modal
          isOpen={!!selectedReportDetail}
          onClose={() => setSelectedReportDetail(null)}
          title={`Field Report: ${selectedReportDetail.reportId}`}
          subtitle={`${selectedReportDetail.locationName} • ${selectedReportDetail.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Units Counted</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {selectedReportDetail.totalAssetsCounted}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Discrepancies Identified</span>
                <span className="text-base font-bold text-amber-600 font-mono">
                  {selectedReportDetail.discrepanciesFound}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Physical Observations & Summary</h4>
              <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {selectedReportDetail.physicalConditionNotes}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Photographic Evidence</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedReportDetail.photoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
