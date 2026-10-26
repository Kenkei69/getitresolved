import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Info,
} from 'lucide-react';
import { FormLabel, FormHelp, FormError, Input, Textarea, Select } from '../components/common/FormField';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

interface FileUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'ready' | 'uploading' | 'uploaded' | 'error';
  errorMessage?: string;
  storageFilename?: string;
}

export const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceAreas, setServiceAreas] = useState<ServiceAreaSummary[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [serviceAreaId, setServiceAreaId] = useState('');
  const [firstNoticedDate, setFirstNoticedDate] = useState('');

  // Attachments state
  const [attachments, setAttachments] = useState<FileUploadItem[]>([]);

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
      .catch((err) => {
        console.error('Failed to load service areas:', err);
      });

    api.getConfig()
      .then((cfg) => {
        setDirectUploadEnabled(Boolean(cfg?.directUploadEnabled));
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    if (attachments.length + selected.length > 3) {
      setError('You can attach a maximum of 3 photos in total.');
      return;
    }

    const newItems: FileUploadItem[] = [];

    for (const f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`"${f.name}" exceeds the 5MB file size limit.`);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setError(`"${f.name}" has an unsupported format. Please select JPEG, PNG, or WEBP.`);
        return;
      }

      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: 'ready',
      });
    }

    setError(null);
    setAttachments((prev) => [...prev, ...newItems]);

    // Reset input value so the same file could be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form field validation
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 15) {
      setError('Please provide more description (at least 15 characters) so department routing can be accurate.');
      return;
    }
    if (address.trim().length < 5) {
      setError('Please specify a street address, intersection, or landmark (at least 5 characters).');
      return;
    }
    if (!serviceAreaId) {
      setError('Please select a municipal ward / service area.');
      return;
    }

    try {
      setSubmitting(true);

      if (directUploadEnabled && attachments.length > 0) {
        // Direct-to-storage upload bypassing 4.5MB Serverless Function payload limit
        const { upload } = await import('@vercel/blob/client');
        const preUploadedAttachments = [];

        // Upload any files not yet uploaded
        for (const item of attachments) {
          if (item.status === 'uploaded' && item.storageFilename) {
            preUploadedAttachments.push({
              originalFilename: item.file.name,
              storageFilename: item.storageFilename,
              mimeType: item.file.type,
              fileSize: item.file.size,
            });
            continue;
          }

          // Mark uploading
          setAttachments((prev) =>
            prev.map((a) => (a.id === item.id ? { ...a, status: 'uploading', errorMessage: undefined } : a))
          );

          try {
            const blob = await upload(item.file.name, item.file, {
              access: 'private',
              handleUploadUrl: '/api/complaints/upload-handler',
            });

            // Mark uploaded
            setAttachments((prev) =>
              prev.map((a) => (a.id === item.id ? { ...a, status: 'uploaded', storageFilename: blob.url } : a))
            );

            preUploadedAttachments.push({
              originalFilename: item.file.name,
              storageFilename: blob.url,
              mimeType: item.file.type,
              fileSize: item.file.size,
            });
          } catch (uploadErr: any) {
            setAttachments((prev) =>
              prev.map((a) =>
                a.id === item.id
                  ? { ...a, status: 'error', errorMessage: uploadErr.message || 'Upload failed' }
                  : a
              )
            );
            throw new Error(`Failed to upload photo "${item.file.name}". You can retry or remove this photo.`);
          }
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
        // Standard server multipart upload
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('address', address.trim());
        formData.append('serviceAreaId', serviceAreaId);
        if (firstNoticedDate) {
          formData.append('firstNoticedDate', firstNoticedDate);
        }
        attachments.forEach((item) => {
          formData.append('attachments', item.file);
        });

        const result = await api.createComplaint(formData);
        setCreatedComplaint(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint. Your entered information has been preserved.');
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Complaint Successfully Submitted
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your civic report has been submitted to the municipal triage system and queued for departmental action.
            </p>
          </div>

          {/* Reference Card with Copy Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Official Tracking Reference
              </span>
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-civic-700 block mt-0.5">
                {createdComplaint.reference}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-xs"
              title="Copy reference number to clipboard"
            >
              {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedRef ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Automated Triage Summary */}
          <div className="bg-civic-50/60 border border-civic-100 rounded-2xl p-5 text-sm text-left space-y-2.5 max-w-md mx-auto">
            <div className="font-bold text-civic-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-civic-600" aria-hidden="true" />
              <span>Initial Triage Summary</span>
            </div>
            <div className="text-slate-700">
              <span className="font-semibold text-slate-800">Assigned Category:</span>{' '}
              {createdComplaint.category?.name || 'Under Administrative Review'}
            </div>
            <div className="text-slate-700">
              <span className="font-semibold text-slate-800">Responsible Department:</span>{' '}
              {createdComplaint.department ? (
                <span className="font-bold text-slate-900">{createdComplaint.department.name}</span>
              ) : (
                <span className="font-medium text-purple-700">Diverted to Manual Triage Queue</span>
              )}
            </div>
            <div className="text-slate-700">
              <span className="font-semibold text-slate-800">Initial Status:</span>{' '}
              <span className="font-bold text-slate-900">{createdComplaint.status}</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              to={`/complaints/${createdComplaint.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              <span>Track Complaint Details</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCreatedComplaint(null);
                setTitle('');
                setDescription('');
                setAddress('');
                setFirstNoticedDate('');
                setAttachments([]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Report Another Issue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUBMISSION FORM
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Local Issue
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Provide issue details and location. Clear information and photo evidence help municipal teams dispatch the right crews and equipment.
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Submission Issue">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Section 1: Issue Details */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-civic-600" aria-hidden="true" />
              <span>1. What is the Problem?</span>
            </h2>
            <span className="text-xs text-slate-400">Required fields marked with *</span>
          </div>

          <div>
            <FormLabel htmlFor="title" required>
              Issue Title
            </FormLabel>
            <Input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole causing vehicular damage"
              disabled={submitting}
            />
            <FormHelp>A concise, descriptive summary of the problem.</FormHelp>
          </div>

          <div>
            <FormLabel htmlFor="description" required>
              Detailed Description
            </FormLabel>
            <Textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, any immediate safety risks to pedestrians or vehicles, visible water pooling, or deterioration..."
              disabled={submitting}
            />
            <FormHelp>
              Include dimensions, severity, or hazards (minimum 15 characters). Accurate details ensure proper classification.
            </FormHelp>
          </div>
        </div>

        {/* Section 2: Location & Ward */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-civic-600" aria-hidden="true" />
              <span>2. Where is it Located?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="serviceArea" required>
                Municipal Ward / Service Area
              </FormLabel>
              <Select
                id="serviceArea"
                required
                value={serviceAreaId}
                onChange={(e) => setServiceAreaId(e.target.value)}
                disabled={submitting}
              >
                {serviceAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} — {area.description}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="address" required>
                Street Address or Landmark
              </FormLabel>
              <Input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Outside 204 Elm St near 4th Ave"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Timeline & Context */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-civic-600" aria-hidden="true" />
              <span>3. Timeline (Optional)</span>
            </h2>
          </div>

          <div className="max-w-xs">
            <FormLabel htmlFor="complaint-firstNoticed">
              Date First Noticed
            </FormLabel>
            <Input
              id="complaint-firstNoticed"
              type="date"
              value={firstNoticedDate}
              onChange={(e) => setFirstNoticedDate(e.target.value)}
              disabled={submitting}
            />
            <FormHelp>Helps determine how long the condition has persisted.</FormHelp>
          </div>
        </div>

        {/* Section 4: Photo Evidence (Accessible, Keyboard-operable) */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-civic-600" aria-hidden="true" />
              <span>4. Photo Attachments (Optional)</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {attachments.length} of 3 photos added
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-3">
              Attach up to 3 photos (JPEG, PNG, WEBP — up to 5 MB each). Clear photos help technicians evaluate equipment needs before dispatch.
            </p>

            {/* Keyboard-operable Upload Area */}
            {attachments.length < 3 && (
              <div>
                <label
                  htmlFor="photo-upload-input"
                  className="border-2 border-dashed border-slate-300 hover:border-civic-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-civic-500 focus-within:border-civic-500"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" aria-hidden="true" />
                  <span className="text-sm font-semibold text-civic-700">Choose photos to upload</span>
                  <span className="text-xs text-slate-400 mt-1">or drag files directly here</span>
                  <input
                    ref={fileInputRef}
                    id="photo-upload-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className="sr-only"
                  />
                </label>
              </div>
            )}

            {/* Thumbnails & Status */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                {attachments.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group shadow-2xs"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeAttachment(item.id)}
                      disabled={submitting}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label={`Remove photo ${item.file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Filename & Status pill */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 text-[11px] bg-slate-900/80 text-white px-2 py-1 rounded-lg backdrop-blur-xs">
                      <span className="truncate">{item.file.name}</span>
                      {item.status === 'uploading' && (
                        <span className="shrink-0 flex items-center gap-1 text-amber-300">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        </span>
                      )}
                      {item.status === 'uploaded' && (
                        <span className="shrink-0 text-emerald-300">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="shrink-0 text-red-300">Error</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[42px] inline-flex items-center"
          >
            Cancel
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            {submitting ? 'Submitting & Triaging...' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </div>
  );
};
