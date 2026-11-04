import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  FileCheck,
  Eye,
  Building,
  Upload,
} from 'lucide-react';
import { WorkReport, Project } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatDateIndian } from '../../utils/rules';

interface DocumentsReportsViewProps {
  reports: WorkReport[];
  projects: Project[];
}

export const DocumentsReportsView: React.FC<DocumentsReportsViewProps> = ({
  reports,
  projects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Standard compliance & contract documents
  const staticDocuments = [
    {
      id: 'doc_001',
      title: 'Tata Consumer Products - Master Audit SLA Agreement',
      category: 'Legal Contract',
      projectCode: 'JSS-2026-0001',
      fileType: 'PDF',
      size: '2.4 MB',
      updatedAt: '2026-10-14',
      status: 'Active',
    },
    {
      id: 'doc_002',
      title: 'Bhiwandi Central Mega Logistics - Storekeeper Sign-Off Slip',
      category: 'Site Sign-Off',
      projectCode: 'JSS-2026-0001',
      fileType: 'PDF / Scanned',
      size: '1.1 MB',
      updatedAt: '2026-11-02',
      status: 'Verified',
    },
    {
      id: 'doc_003',
      title: 'KPMG India LLP - Pharma Machinery Fixed Asset Register',
      category: 'FAR Extract',
      projectCode: 'JSS-2026-0002',
      fileType: 'XLSX',
      size: '4.8 MB',
      updatedAt: '2026-10-28',
      status: 'Active',
    },
    {
      id: 'doc_004',
      title: 'Apex Audit Solutions LLP - Sub-Contractor NDA & KYC Pack',
      category: 'Vendor Agreement',
      projectCode: 'JSS-2026-0001',
      fileType: 'PDF',
      size: '3.2 MB',
      updatedAt: '2026-10-18',
      status: 'Verified',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Documents & Compliance Repository</h2>
          <p className="text-xs text-slate-500">
            Client work orders, vendor sub-contractor agreements, site sign-off slips & verified audit reports.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by Title, Project Code, Category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Format & Size</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staticDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>{doc.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{doc.projectCode}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {doc.fileType} ({doc.size})
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{formatDateIndian(doc.updatedAt)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={doc.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white rounded text-slate-800 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document View Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          subtitle={`Category: ${selectedDoc.category} • Format: ${selectedDoc.fileType}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Project Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDoc.projectCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">File Size:</span>
                <span className="font-mono text-slate-900">{selectedDoc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <StatusBadge status={selectedDoc.status} size="sm" />
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed bg-white p-3 border border-slate-200 rounded-lg">
              Official document stored in private JaySoftShine vault. Cryptographically signed for legal compliance.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert(`Downloading verified file: ${selectedDoc.title}`)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Secure File</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
