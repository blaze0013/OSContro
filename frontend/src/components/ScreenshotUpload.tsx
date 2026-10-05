import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { MAX_FILE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from '../lib/constants';

interface ScreenshotUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function ScreenshotUpload({ file, onChange, disabled }: ScreenshotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFile = (selectedFile: File) => {
    setError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed: PNG, JPEG, WEBP.`);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    onChange(selectedFile);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
          UI Bug Screenshot <span className="text-[var(--color-text-secondary)] font-normal">(Optional)</span>
        </label>
      </div>
      
      {!file ? (
        <div
          className={`relative block w-full rounded-[12px] border-2 border-dashed p-8 text-center hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 transition-colors ${
            isDragging ? 'border-[var(--color-accent)] bg-[var(--color-raised)]' : 'border-[var(--color-border-soft)] bg-[var(--color-page)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <svg className="mx-auto h-10 w-10 text-[var(--color-text-secondary)]" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4 flex text-sm leading-6 text-[var(--color-text-secondary)] justify-center">
            <span className="relative rounded-md font-semibold text-[var(--color-accent)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 hover:text-[var(--color-accent-hover)]">
              Upload a file
            </span>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-secondary)] opacity-80">PNG, JPG, WEBP up to 5MB</p>
        </div>
      ) : (
        <div className="relative rounded-[12px] overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-page)] shadow-[var(--shadow-warm)]">
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-strong)] bg-[var(--color-raised)]">
            <div className="truncate pr-4 text-sm font-medium text-[var(--color-text-primary)]">
              {file.name}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-soft)] focus:outline-none disabled:opacity-50 transition-colors"
            >
              <span className="sr-only">Remove</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <div className="h-48 bg-[var(--color-page)] flex items-center justify-center p-2">
             {previewUrl && (
               <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
             )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-[var(--color-error-text)]">
          {error}
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        className="hidden"
      />
    </div>
  );
}
