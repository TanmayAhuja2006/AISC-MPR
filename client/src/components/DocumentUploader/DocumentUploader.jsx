import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './DocumentUploader.css';

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function DocumentUploader({ onUploadSuccess }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [error, setError]         = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/documents')
      .then(({ data }) => {
        if (isMounted && data.documents) {
          setDocuments(data.documents);
        }
      })
      .catch(() => {
        // Silently catch on initial load if not logged in
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20 MB.');
      return;
    }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append('file', file);

    try {
      const { data } = await api.post('/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocuments((prev) => [data.document, ...prev]);
      onUploadSuccess?.(data.document);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setError('Failed to delete document.');
    }
  };

  return (
    <div className="doc-uploader">
      {/* Drop zone */}
      <div
        className={`doc-dropzone ${dragOver ? 'doc-dropzone--active' : ''} ${uploading ? 'doc-dropzone--uploading' : ''}`}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload document"
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <>
            <Loader2 size={36} className="doc-dropzone__spin" />
            <p>Uploading & indexing…</p>
          </>
        ) : (
          <>
            <Upload size={36} className="doc-dropzone__icon" />
            <p className="doc-dropzone__title">Drop file or click to upload</p>
            <p className="doc-dropzone__sub">PDF, JPEG, PNG, WEBP — max 20 MB</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="doc-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.id} className="doc-item">
              <FileText size={18} className="doc-item__icon" />
              <div className="doc-item__info">
                <span className="doc-item__name" title={doc.original_name || doc.originalName}>
                  {doc.original_name || doc.originalName}
                </span>
                <span className="doc-item__meta">
                  {formatSize(doc.file_size || doc.fileSize)}
                  {doc.indexed ? (
                    <span className="doc-item__indexed">
                      <CheckCircle size={11} /> Indexed
                    </span>
                  ) : (
                    <span className="doc-item__pending">Pending Indexing</span>
                  )}
                </span>
              </div>
              <button
                className="doc-item__del"
                onClick={() => handleDelete(doc.id)}
                aria-label={`Delete ${doc.original_name || doc.originalName}`}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
