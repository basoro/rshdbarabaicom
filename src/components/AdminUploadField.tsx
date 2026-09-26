import { useRef, useState, type ChangeEvent } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { adminUploadFile } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';

type AdminUploadFieldProps = {
  label: string;
  target: string;
  accept?: string;
  helpText?: string;
  onUploaded: (result: { filePath: string; fileUrl: string; originalName: string }) => void;
};

export default function AdminUploadField({
  label,
  target,
  accept,
  helpText,
  onUploaded,
}: AdminUploadFieldProps) {
  const token = useAdminStore((state) => state.token);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token || uploadingRef.current) return;

    uploadingRef.current = true;
    setUploading(true);
    setError('');
    try {
      const result = await adminUploadFile(token, file, target);
      onUploaded(result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload gagal.');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
          {helpText ? (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{helpText}</p>
          ) : null}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Mengunggah...' : 'Pilih File'}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}
