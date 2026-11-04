import React, { useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  Search,
  Filter,
  Plus,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AttendanceRecord, Project, ProjectLocation, Auditor, Vendor } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatDateIndian } from '../../utils/rules';

interface AttendanceMandaysViewProps {
  attendance: AttendanceRecord[];
  projects: Project[];
  locations: ProjectLocation[];
  auditors: Auditor[];
  vendors: Vendor[];
  onApprove: (attendanceId: string, approvedBy: string) => void;
  onReject: (attendanceId: string, reason: string) => void;
  onAddAttendance: (record: AttendanceRecord) => void;
}

export const AttendanceMandaysView: React.FC<AttendanceMandaysViewProps> = ({
  attendance,
  projects,
  locations,
  auditors,
  vendors,
  onApprove,
  onReject,
  onAddAttendance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  // New attendance submission form
  const [form, setForm] = useState({
    projectId: projects[0]?.id || '',
    locationId: locations[0]?.id || '',
    auditorId: auditors[0]?.id || '',
    workDate: new Date().toISOString().split('T')[0],
    checkInTime: '09:00 AM',
    checkOutTime: '06:00 PM',
    isHalfDay: false,
    mandays: 1.0,
    remarks: 'Full day physical verification completed.',
    gpsLocation: '19.0760° N, 72.8777° E (Mumbai)',
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
  });

  const filteredAttendance = attendance.filter((a) => {
    const matchesSearch =
      a.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.auditorName && a.auditorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.vendorName && a.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || a.approvalStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalApprovedMandays = attendance
    .filter((a) => a.approvalStatus === 'Approved')
    .reduce((sum, a) => sum + a.mandays, 0);

  const pendingCount = attendance.filter((a) => a.approvalStatus === 'Pending').length;

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === form.projectId) || projects[0];
    const loc = locations.find((l) => l.id === form.locationId) || locations[0];
    const aud = auditors.find((a) => a.id === form.auditorId) || auditors[0];

    const record: AttendanceRecord = {
      id: `att_${Date.now()}`,
      projectId: proj.id,
      projectName: proj.name,
      locationId: loc.id,
      locationName: loc.siteName,
      assignmentId: `asn_manual`,
      auditorId: aud.id,
      auditorName: aud.name,
      workDate: form.workDate,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      isHalfDay: form.isHalfDay,
      mandays: form.isHalfDay ? 0.5 : Number(form.mandays),
      remarks: form.remarks,
      gpsLocation: form.gpsLocation,
      photoUrl: form.photoUrl,
      submittedBy: aud.name,
      approvalStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    onAddAttendance(record);
    setIsSubmitModalOpen(false);
  };

  const handleConfirmReject = () => {
    if (rejectingId && rejectReason.trim()) {
      onReject(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Attendance & Approved Mandays</h2>
          <p className="text-xs text-slate-500">
            Daily site check-ins, geo-tagged photo verification, approval queues & approved manday ledger.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved Mandays: {totalApprovedMandays} Days</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Site Attendance</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Site Name, Auditor, Project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">All Statuses ({attendance.length})</option>
            <option value="Pending">Pending Approval ({pendingCount})</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Site Location</th>
                <th className="py-3 px-4">Field Auditor / Vendor</th>
                <th className="py-3 px-4">Mandays</th>
                <th className="py-3 px-4">Site Proof & GPS</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-slate-900">{formatDateIndian(rec.workDate)}</div>
                    <div className="text-[11px] text-slate-500">{rec.checkInTime} - {rec.checkOutTime}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{rec.locationName}</div>
                    <div className="text-[11px] text-slate-500">{rec.projectName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{rec.auditorName || rec.vendorName}</div>
                    <div className="text-[11px] text-slate-400">By: {rec.submittedBy}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      rec.mandays === 1 ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.mandays} {rec.isHalfDay ? 'Half Day' : 'Manday'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {rec.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setViewPhotoUrl(rec.photoUrl || null)}
                          className="w-7 h-7 rounded border border-slate-300 overflow-hidden hover:opacity-80"
                          title="Click to view site photo proof"
                        >
                          <img src={rec.photoUrl} alt="Proof" className="w-full h-full object-cover" />
                        </button>
                      )}
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{rec.gpsLocation || 'Verified on site'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[180px] truncate">
                    {rec.remarks || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rec.approvalStatus} size="sm" />
                    {rec.approvedBy && (
                      <div className="text-[10px] text-slate-400 mt-0.5">By {rec.approvedBy}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {rec.approvalStatus === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApprove(rec.id, 'Super Admin')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(rec.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Attendance Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Site Attendance"
        subtitle="Record daily mandays with check-in, check-out and geo-tagged proof"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitAttendance} className="space-y-4">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auditor <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.auditorId}
                onChange={(e) => setForm({ ...form, auditorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none bg-white"
              >
                {auditors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.auditorId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Date</label>
              <input
                type="date"
                required
                value={form.workDate}
                onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Time</label>
              <input
                type="text"
                value={form.checkInTime}
                onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Time</label>
              <input
                type="text"
                value={form.checkOutTime}
                onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={form.isHalfDay}
                onChange={(e) => setForm({ ...form, isHalfDay: e.target.checked, mandays: e.target.checked ? 0.5 : 1.0 })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <label htmlFor="isHalfDay" className="text-xs font-semibold text-slate-700">
                Half Day Attendance (0.5 Manday)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mandays Count</label>
              <input
                type="number"
                step="0.5"
                disabled={form.isHalfDay}
                value={form.mandays}
                onChange={(e) => setForm({ ...form, mandays: Number(e.target.value) })}
                className="w-full font-mono rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Remarks & Physical Progress</label>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
              Submit Attendance for Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Dialog */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title="Reject Attendance Record"
        subtitle="Provide mandatory rejection reason to auditor/vendor"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Mismatched GPS coordinates or store keeper signature missing from sheet..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingId(null)}
              className="px-3 py-1.5 border border-slate-300 text-xs rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Photo View Modal */}
      {viewPhotoUrl && (
        <Modal
          isOpen={!!viewPhotoUrl}
          onClose={() => setViewPhotoUrl(null)}
          title="Site Geo-Tagged Verification Photo"
          subtitle="Audit evidence capture"
          maxWidth="lg"
        >
          <div className="space-y-3">
            <img src={viewPhotoUrl} alt="Site Proof" className="w-full max-h-[70vh] object-contain rounded-lg" />
            <div className="text-center">
              <button
                type="button"
                onClick={() => setViewPhotoUrl(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
