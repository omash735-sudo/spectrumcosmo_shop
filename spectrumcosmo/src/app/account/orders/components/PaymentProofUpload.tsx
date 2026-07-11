// app/account/orders/components/PaymentProofUpload.tsx
'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface PaymentProofUploadProps {
  orderId: string;
  onUpload: (file: File, note: string, transactionRef: string) => Promise<void>;
  uploading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PaymentProofUpload({ orderId, onUpload, uploading }: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
  };

  const removeFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    await onUpload(file, note, transactionRef);
    removeFile();
    setNote('');
    setTransactionRef('');
  };

  return (
    <div className="border-t border-[var(--border)] pt-4">
      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-2">
        Upload Payment Proof
      </label>

      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition cursor-pointer ${
            dragActive ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]'
          }`}
          onClick={() => document.getElementById(`file-upload-${orderId}`)?.click()}
        >
          <Upload size={24} className="text-[var(--foreground-muted)] mx-auto mb-1 sm:w-8 sm:h-8" />
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Drag & drop your receipt here, or click to browse</p>
          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]/60 mt-1">PNG, JPG up to 5MB</p>
          <input
            id={`file-upload-${orderId}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
          />
        </div>
      ) : (
        <div className="bg-[var(--background-secondary)] rounded-xl p-3 border border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            {preview ? (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background)] rounded-lg overflow-hidden relative border border-[var(--border)]">
                <Image src={preview} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background)] rounded-lg flex items-center justify-center border border-[var(--border)]">
                <ImageIcon size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate">{file.name}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button onClick={removeFile} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition">
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 mt-3">
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="Transaction reference (optional)"
          className="w-full px-3 py-2 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional notes (optional)"
          rows={2}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={uploading || !file}
        className="w-full mt-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-xl font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
        {uploading ? 'Submitting...' : 'Submit Payment Proof'}
      </button>
    </div>
  );
}
