import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coursesApi } from '../services/api';
import { notifications } from '../services/notifications';
import { useAuthStore } from '../stores/auth';
import './AddCourse.css';

export default function AddCourse() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Guard: only admin or teacher
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return <div style={{ padding: 20 }}>No autorizado</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    // If we're creating the course from within a module page, send the module id.
    // Otherwise send a legacy category string for backward compatibility.
    if (moduleId) {
      form.append('module', moduleId);
    } else {
      form.append('category', 'fullstack');
    }
    if (thumbnail) form.append('thumbnail', thumbnail);

    try {
      const response = await coursesApi.create(form);
      const createdCourse = response.data;
      notifications.success('Curso creado');
      // Mongoose returns _id; prefer _id but fall back to id if present
      const courseId = (createdCourse as any)._id || (createdCourse as any).id;
      if (courseId) {
        // Redirect to add chapter immediately so teacher can upload materials
        navigate(`/courses/${courseId}/add-chapter`);
      } else {
        // Fallback: go back to module listing
        navigate(moduleId ? `/modules/${moduleId}` : '/courses');
      }
    } catch (err: any) {
      notifications.error(err?.response?.data?.message || 'Error al crear curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-course-container">
      <h1>Crear Curso</h1>
      <form className="add-course-form" onSubmit={handleSubmit}>
        <div>
          <label>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div>
          <label>Miniatura</label>
          <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Curso'}</button>
        </div>
      </form>
    </div>
  );
}
