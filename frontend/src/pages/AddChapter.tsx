import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import './AddChapter.css';

export default function AddChapter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    if (files) {
      // Append all files under field name 'files'
      Array.from(files).forEach((f) => form.append('files', f));
    }

    try {
      await coursesApi.addChapter(id, form);
      notifications.success('Capítulo agregado con archivos.');
      navigate(`/courses/${id}`);
    } catch (err: any) {
      notifications.error(err?.response?.data?.message || 'Error al agregar capítulo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-chapter-container">
      <h1>Añadir capítulo y documentos</h1>
      <form onSubmit={handleSubmit} className="add-chapter-form">
        <div>
          <label>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div>
          <label>Archivos (PDF, PPTX, MP4, imágenes)</label>
          <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        </div>

        <div>
          <button type="submit" disabled={loading}>{loading ? 'Subiendo...' : 'Agregar capítulo'}</button>
        </div>
      </form>
    </div>
  );
}
