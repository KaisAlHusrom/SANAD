import { useRef, type ChangeEvent, type RefObject } from 'react';
import { useUpload, type UploadStatus } from './use-upload';

interface UseUploadButtonResult {
  inputRef: RefObject<HTMLInputElement | null>;
  openFileDialog: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  status: UploadStatus;
  error: string | null;
  isUploading: boolean;
}

/** File-input wiring for the upload button (U5): opens the picker + runs `useUpload`. */
export function useUploadButton(folderId?: string): UseUploadButtonResult {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, status, error, isUploading } = useUpload();

  const openFileDialog = () => inputRef.current?.click();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (file) {
      await upload(file, folderId);
    }
  };

  return { inputRef, openFileDialog, onFileChange, status, error, isUploading };
}
