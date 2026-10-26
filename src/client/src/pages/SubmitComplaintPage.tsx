import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ServiceAreaSummary, ComplaintItem } from '../../../shared/types';
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Copy,
  Check,
} from 'lucide-react';

export const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  const [serviceAreas, setServiceAreas] = useState<ServiceAreaSummary[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [serviceAreaId, setServiceAreaId] = useState('');
  const [firstNoticedDate, setFirstNoticedDate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [directUploadEnabled, setDirectUploadEnabled] = useState(false);

  useEffect(() => {
    api.getServiceAreas()
      .then((areas) => {
        setServiceAreas(areas);
        if (areas.length > 0) setServiceAreaId(areas[0].id);
      })
      .catch(console.error);

    api.getConfig()
      .then((cfg) => {
        setDirectUploadEnabled(Boolean(cfg?.directUploadEnabled));
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    if (files.length + selected.length > 3) {
      setError('You can attach a maximum of 3 photos.');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 5MB size limit.`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setError(`File "${f.name}" has invalid format. Only JPEG, PNG, or WEBP are permitted.`);
        return;
      }
      validFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }

    setError(null);
    setFiles([...files, ...validFiles]);
    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 15) {
      setError('Please provide more description (at least 15 characters) so AI classification is accurate.');
      return;
    }
    if (address.trim().length < 5) {
      setError('Please provide a specific street address or landmark (at least 5 characters).');
      return;
    }
    if (!serviceAreaId) {
      setError('Please select a service area/ward.');
      return;
    }

    try {
      setSubmitting(true);

      if (directUploadEnabled && files.length > 0) {
        // Direct-to-storage upload bypassing 4.5MB Serverless Function payload limit
        const { upload } = await import('@vercel/blob/client');
        const preUploadedAttachments = [];
        for (const file of files) {
          const blob = await upload(file.name, file, {
            access: 'private',
            handleUploadUrl: '/api/complaints/upload-handler',
          });
          preUploadedAttachments.push({
            originalFilename: file.name,
            storageFilename: blob.url,
            mimeType: file.type,
            fileSize: file.size,
          });
        }

        const result = await api.createComplaint({
          title: title.trim(),
          description: description.trim(),
          address: address.trim(),
          serviceAreaId,
          firstNoticedDate: firstNoticedDate || undefined,
          preUploadedAttachments,
        });
        setCreatedComplaint(result);
      } else {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('address', address.trim());
        formData.append('serviceAreaId', serviceAreaId);
        if (firstNoticedDate) {
          formData.append('firstNoticedDate', firstNoticedDate);
        }
        files.forEach((file) => {
          formData.append('attachments', file);
        });

        const result = await api.createComplaint(formData);
        setCreatedComplaint(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint. Please check fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (createdComplaint) {
      navigator.clipboard.writeText(createdComplaint.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdComplaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Complaint Successfully Submitted
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your report has been securely registered in the municipal database and processed through AI classification.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Official Complaint Reference
              </span>
              <span className="font-mono text-xl font-bold text-civic-700">
                {createdComplaint.reference}
              </span>
            </div>
            <button
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Copy reference number"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRef ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Automated Triage Summary */}
          <div className="bg-civic-50/50 border border-civic-100 rounded-xl p-4 text-xs text-left space-y-2 max-w-md mx-auto">
            <div className="font-semibold text-civic-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-civic-600" />
              Automated Triage Result
            </div>
            <div className="text-slate-700">
              <b>Category:</b> {createdComplaint.category?.name || 'Uncertain / Pending Review'}
            </div>
            <div className="text-slate-700">
              <b>Assigned Department:</b>{' '}
              {createdComplaint.department ? (
                <span className="font-semibold text-slate-900">{createdComplaint.department.name}</span>
              ) : (
                <span className="font-medium text-purple-700">Sent to Administrator Manual Review</span>
              )}
            </div>
            <div className="text-slate-700">
              <b>Status:</b>{' '}
              <span className="font-semibold uppercase text-slate-800">{createdComplaint.status}</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/complaints/${createdComplaint.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-sm transition-colors"
            >
              Track Complaint Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCreatedComplaint(null);
                setTitle('');
                setDescription('');
                setAddress('');
                setFirstNoticedDate('');
                setFiles([]);
                setFilePreviews([]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBMISSION FORM
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report a Civic Issue</h1>
        <p className="text-xs text-slate-500">
          Provide issue details below. Our AI triage system will categorize your complaint and route it to the responsible municipal department.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Group 1: What Happened */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-civic-600" />
            1. What Happened
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="title">
              Short Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep asphalt pothole damaging tires"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="description">
              Detailed Description <span className="text-red-500">*</span>
              <span className="text-[11px] font-normal text-slate-400 block">
                Be specific about safety hazards, dimensions, or severity (min 15 characters).
              </span>
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, any ongoing hazards, vehicle or pedestrian danger, and exact symptoms..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
            />
          </div>
        </div>

        {/* Group 2: Location */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-civic-600" />
            2. Where Did It Occur
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="serviceArea">
                Service Area / Ward <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceArea"
                required
                value={serviceAreaId}
                onChange={(e) => setServiceAreaId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:border-civic-500"
              >
                {serviceAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} — {area.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="address">
                Street Address or Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Outside 204 Elm St near 4th Ave"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500 focus:ring-1 focus:ring-civic-500"
              />
            </div>
          </div>
        </div>

        {/* Group 3: Optional Context */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-civic-600" />
            3. Context & Timeline
          </h2>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="noticedDate">
              Date First Noticed (Optional)
            </label>
            <input
              id="noticedDate"
              type="date"
              value={firstNoticedDate}
              onChange={(e) => setFirstNoticedDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-civic-500"
            />
          </div>
        </div>

        {/* Group 4: Photo Attachments */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-civic-600" />
            4. Photo Evidence (Optional)
          </h2>

          <div>
            <span className="text-[11px] text-slate-500 block mb-2">
              Attach up to 3 photos (JPEG, PNG, WEBP — max 5MB each). Visual evidence accelerates department dispatch.
            </span>

            {/* Upload Zone */}
            {files.length < 3 && (
              <label className="border-2 border-dashed border-slate-200 hover:border-civic-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-civic-600">Click to upload photos</span>
                <span className="text-[11px] text-slate-400 mt-0.5">or drag files directly here</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Thumbnail Previews */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {filePreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 group">
                    <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-900/60 text-white font-mono">
                      {files[idx]?.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting & Triaging...' : 'Submit Complaint'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
