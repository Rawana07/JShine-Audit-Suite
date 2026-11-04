import React, { useState, useRef } from 'react';
import {
  MapPin,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  UserCheck,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectLocation, Project, Auditor, Vendor, LocationStatus } from '../../types/erp';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { formatINR, formatDateIndian } from '../../utils/rules';

interface LocationsViewProps {
  locations: ProjectLocation[];
  projects: Project[];
  auditors: Auditor[];
  vendors: Vendor[];
  onAddLocations: (newLocations: ProjectLocation[]) => void;
  onUpdateLocation: (location: ProjectLocation) => void;
  onDeleteLocation?: (locationId: string) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  projects,
  auditors,
  vendors,
  onAddLocations,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSingleAddModalOpen, setIsSingleAddModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<ProjectLocation | null>(null);

  // Bulk import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetProjectId, setImportTargetProjectId] = useState<string>(projects[0]?.id || '');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Single Add Form
  const [singleLoc, setSingleLoc] = useState({
    projectId: projects[0]?.id || '',
    clientSiteCode: '',
    siteName: '',
    address: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    contactPerson: '',
    contactPhone: '',
    plannedVisitDate: new Date().toISOString().split('T')[0],
    estimatedMandays: 1,
    clientBillingRate: 1500,
    executionCostRate: 1000,
  });

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.locationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.clientSiteCode && loc.clientSiteCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProj = selectedProjectId === 'ALL' || loc.projectId === selectedProjectId;
    const matchesStatus = selectedStatus === 'ALL' || loc.status === selectedStatus;
    return matchesSearch && matchesProj && matchesStatus;
  });

  // Download Sample Template for Bulk Import
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Site Code': 'TCPL-WH-PUN-01',
        'Site Name': 'Pune Chakan Distribution Warehouse',
        'Address': 'Plot A-12, MIDC Phase 2, Chakan',
        'City': 'Pune',
        'District': 'Pune',
        'State': 'Maharashtra',
        'Pincode': '410501',
        'Site Contact Person': 'Anil Deshmukh',
        'Contact Number': '9822012345',
        'Planned Visit Date': '2026-11-15',
        'Estimated Mandays': 1,
        'Client Billing Rate': 1500,
        'Execution Cost Rate': 1000,
      },
      {
        'Site Code': 'TCPL-WH-NGP-02',
        'Site Name': 'Nagpur Butibori Logistics Hub',
        'Address': 'Plot 45, Butibori Industrial Area',
        'City': 'Nagpur',
        'District': 'Nagpur',
        'State': 'Maharashtra',
        'Pincode': '441108',
        'Site Contact Person': 'Suresh Rathi',
        'Contact Number': '9823054321',
        'Planned Visit Date': '2026-11-18',
        'Estimated Mandays': 1,
        'Client Billing Rate': 1500,
        'Execution Cost Rate': 1000,
      },
      {
        'Site Code': 'TCPL-WH-SUR-03',
        'Site Name': 'Surat Sachin GIDC Fulfillment Centre',
        'Address': 'Plot 102, Road 5, GIDC Sachin',
        'City': 'Surat',
        'District': 'Surat',
        'State': 'Gujarat',
        'Pincode': '394230',
        'Site Contact Person': 'Mahesh Joshi',
        'Contact Number': '9898099881',
        'Planned Visit Date': '2026-11-20',
        'Estimated Mandays': 1,
        'Client Billing Rate': 1500,
        'Execution Cost Rate': 1200,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LocationTemplate');
    XLSX.writeFile(workbook, 'JaySoftShine_Location_Bulk_Import_Template.xlsx');
  };

  // Export current list to Excel
  const handleExportLocations = () => {
    const exportData = filteredLocations.map((loc) => ({
      'Location ID': loc.locationId,
      'Project Code': loc.projectCode,
      'Client Site Code': loc.clientSiteCode,
      'Site Name': loc.siteName,
      'Address': loc.address,
      'City': loc.city,
      'District': loc.district,
      'State': loc.state,
      'PIN': loc.pincode,
      'Contact Person': loc.contactPerson,
      'Contact Phone': loc.contactPhone,
      'Planned Date': loc.plannedVisitDate,
      'Estimated Mandays': loc.estimatedMandays,
      'Actual Mandays': loc.actualMandays,
      'Assigned To': loc.assignedEntityName || 'Unallocated',
      'Assigned Type': loc.assignedType || '-',
      'Client Rate (INR)': loc.clientBillingRate,
      'Cost Rate (INR)': loc.executionCostRate,
      'Status': loc.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProjectLocations');
    XLSX.writeFile(workbook, `JaySoftShine_Locations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle File Upload and Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          setImportErrors(['Uploaded file contains no rows.']);
          setParsedRows([]);
          return;
        }

        // Validate mandatory columns
        const errors: string[] = [];
        data.forEach((row: any, idx: number) => {
          if (!row['Site Name'] && !row['site_name'] && !row['SiteName']) {
            errors.push(`Row ${idx + 2}: Missing mandatory Site Name.`);
          }
          if (!row['City'] && !row['city']) {
            errors.push(`Row ${idx + 2}: Missing City.`);
          }
        });

        setImportErrors(errors.slice(0, 5));
        setParsedRows(data);
      } catch (err: any) {
        setImportErrors([`Failed to parse file: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit Bulk Import
  const handleConfirmImport = () => {
    if (!parsedRows.length) return;
    setIsImporting(true);

    const targetProject = projects.find((p) => p.id === importTargetProjectId) || projects[0];
    const existingCount = locations.filter((l) => l.projectId === targetProject.id).length;

    const newLocations: ProjectLocation[] = parsedRows.map((row, idx) => {
      const locSeq = existingCount + idx + 1;
      const locationId = `${targetProject.projectId}-L${String(locSeq).padStart(3, '0')}`;

      return {
        id: `loc_${Date.now()}_${idx}`,
        projectId: targetProject.id,
        projectCode: targetProject.projectId,
        locationId,
        clientSiteCode: row['Site Code'] || row['site_code'] || `SITE-${locSeq}`,
        siteName: row['Site Name'] || row['site_name'] || 'Unnamed Site',
        address: row['Address'] || row['address'] || '',
        city: row['City'] || row['city'] || 'Mumbai',
        district: row['District'] || row['district'] || '',
        state: row['State'] || row['state'] || 'Maharashtra',
        pincode: String(row['Pincode'] || row['pincode'] || '400001'),
        contactPerson: row['Site Contact Person'] || row['contact_person'] || '',
        contactPhone: String(row['Contact Number'] || row['contact_phone'] || ''),
        plannedVisitDate: row['Planned Visit Date'] || new Date().toISOString().split('T')[0],
        estimatedMandays: Number(row['Estimated Mandays'] || 1),
        actualMandays: 0,
        clientBillingRate: Number(row['Client Billing Rate'] || targetProject.clientRatePerManday || 1500),
        executionCostRate: Number(row['Execution Cost Rate'] || 1000),
        status: 'Unallocated',
        createdAt: new Date().toISOString(),
      };
    });

    onAddLocations(newLocations);
    setIsImporting(false);
    setIsImportModalOpen(false);
    setParsedRows([]);
    setImportErrors([]);
  };

  // Handle Single Location Add
  const handleCreateSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find((p) => p.id === singleLoc.projectId) || projects[0];
    const existingCount = locations.filter((l) => l.projectId === targetProject.id).length;
    const locationId = `${targetProject.projectId}-L${String(existingCount + 1).padStart(3, '0')}`;

    const newLocation: ProjectLocation = {
      id: `loc_${Date.now()}`,
      projectId: targetProject.id,
      projectCode: targetProject.projectId,
      locationId,
      clientSiteCode: singleLoc.clientSiteCode || `SITE-${existingCount + 1}`,
      siteName: singleLoc.siteName,
      address: singleLoc.address,
      city: singleLoc.city,
      district: singleLoc.district,
      state: singleLoc.state,
      pincode: singleLoc.pincode,
      contactPerson: singleLoc.contactPerson,
      contactPhone: singleLoc.contactPhone,
      plannedVisitDate: singleLoc.plannedVisitDate,
      estimatedMandays: Number(singleLoc.estimatedMandays),
      actualMandays: 0,
      clientBillingRate: Number(singleLoc.clientBillingRate),
      executionCostRate: Number(singleLoc.executionCostRate),
      status: 'Unallocated',
      createdAt: new Date().toISOString(),
    };

    onAddLocations([newLocation]);
    setIsSingleAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Location Master</h2>
          <p className="text-xs text-slate-500">
            Multi-site project locations with geo-coordinates, client site codes, execution costs & statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportLocations}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white hover:bg-black text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bulk Excel Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSingleAddModalOpen(true)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            title="Add Single Location"
          >
            <Plus className="w-4 h-4" />
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
            placeholder="Search by Site Name, Location ID (JSS-2026-0001-L001), City..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900 max-w-[200px]"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectId} - {p.name.substring(0, 25)}...
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="Unallocated">Unallocated</option>
            <option value="Allocated">Allocated</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Revisit Required">Revisit Required</option>
          </select>
        </div>
      </div>

      {/* Locations Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Location ID</th>
                <th className="py-3 px-3">Site Details</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Assigned Resource</th>
                <th className="py-3 px-3">Visit Date</th>
                <th className="py-3 px-3">Mandays</th>
                <th className="py-3 px-3">Client Rate</th>
                <th className="py-3 px-3">Execution Cost</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    <div>{loc.locationId}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{loc.clientSiteCode}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{loc.siteName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{loc.address}</div>
                    <div className="text-[10px] text-slate-400">{loc.city}, {loc.state} - {loc.pincode}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {loc.projectCode}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {loc.assignedEntityName ? (
                      <div>
                        <div className="font-medium text-slate-900">{loc.assignedEntityName}</div>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {loc.assignedType}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unallocated</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono">
                    {formatDateIndian(loc.plannedVisitDate)}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div>Est: {loc.estimatedMandays}</div>
                    {loc.actualMandays > 0 && <div className="text-emerald-600 font-bold">Act: {loc.actualMandays}</div>}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    {formatINR(loc.clientBillingRate)}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    {formatINR(loc.executionCostRate)}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={loc.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {onDeleteLocation && (
                      <button
                        type="button"
                        onClick={() => setLocationToDelete(loc)}
                        title="Delete Location"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Excel Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Excel / CSV Location Import"
        subtitle="Import hundreds of sites from client excel rosters with automatic validation"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">1. Download Structured Template</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download the standardized XLSX template with all columns mapped for site codes, PINs, rates and contacts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Excel Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={importTargetProjectId}
                onChange={(e) => setImportTargetProjectId(e.target.value)}
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
                Upload File (.xlsx or .csv) <span className="text-rose-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-black"
              />
            </div>
          </div>

          {/* Errors box */}
          {importErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Validation Warnings Detected:
              </div>
              <ul className="list-disc pl-5 text-[11px]">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Preview Data ({parsedRows.length} Locations Ready to Import)
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validated Successfully
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Site Code</th>
                      <th className="py-2 px-3">Site Name</th>
                      <th className="py-2 px-3">City</th>
                      <th className="py-2 px-3">State</th>
                      <th className="py-2 px-3">Contact Person</th>
                      <th className="py-2 px-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono">{row['Site Code'] || row['site_code'] || '-'}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{row['Site Name'] || row['site_name']}</td>
                        <td className="py-2 px-3">{row['City'] || row['city']}</td>
                        <td className="py-2 px-3">{row['State'] || row['state']}</td>
                        <td className="py-2 px-3">{row['Site Contact Person'] || row['contact_person'] || '-'}</td>
                        <td className="py-2 px-3 font-mono">₹{row['Client Billing Rate'] || 1500}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <div className="text-[11px] text-slate-500 text-center">
                  Showing first 10 of {parsedRows.length} records.
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0 || isImporting}
              onClick={handleConfirmImport}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Confirm & Import {parsedRows.length} Sites</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Add Location Modal */}
      <Modal
        isOpen={isSingleAddModalOpen}
        onClose={() => setIsSingleAddModalOpen(false)}
        title="Add Single Location"
        subtitle="Manual location entry for an active audit project"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSingle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={singleLoc.projectId}
                onChange={(e) => setSingleLoc({ ...singleLoc, projectId: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Site Code</label>
              <input
                type="text"
                value={singleLoc.clientSiteCode}
                onChange={(e) => setSingleLoc({ ...singleLoc, clientSiteCode: e.target.value })}
                placeholder="e.g. TCPL-WH-PUN-01"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site / Warehouse Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={singleLoc.siteName}
                onChange={(e) => setSingleLoc({ ...singleLoc, siteName: e.target.value })}
                placeholder="e.g. Bhiwandi Central Mega Logistics Park"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address</label>
              <input
                type="text"
                value={singleLoc.address}
                onChange={(e) => setSingleLoc({ ...singleLoc, address: e.target.value })}
                placeholder="Survey number, Industrial area, Landmark..."
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={singleLoc.city}
                onChange={(e) => setSingleLoc({ ...singleLoc, city: e.target.value })}
                placeholder="Pune"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={singleLoc.state}
                onChange={(e) => setSingleLoc({ ...singleLoc, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={singleLoc.contactPerson}
                onChange={(e) => setSingleLoc({ ...singleLoc, contactPerson: e.target.value })}
                placeholder="Site Manager"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={singleLoc.contactPhone}
                onChange={(e) => setSingleLoc({ ...singleLoc, contactPhone: e.target.value })}
                placeholder="9820011223"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Rate (₹)</label>
              <input
                type="number"
                value={singleLoc.clientBillingRate}
                onChange={(e) => setSingleLoc({ ...singleLoc, clientBillingRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Cost (₹)</label>
              <input
                type="number"
                value={singleLoc.executionCostRate}
                onChange={(e) => setSingleLoc({ ...singleLoc, executionCostRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSingleAddModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Save Location
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
