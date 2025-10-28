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

  // solo admin o teacher
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return <div style={{ padding: 20 }}>No autorizado</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    // Si creamos el curso desde la página de un módulo, enviar el id del módulo.
    // De lo contrario, enviar una categoría legada para compatibilidad hacia atrás.
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
      // Mongoose devuelve _id; preferir _id pero usar id si existe
      const courseId = (createdCourse as any)._id || (createdCourse as any).id;
      if (courseId) {
        // Redirigir a añadir capítulo inmediatamente para que el profesor pueda subir materiales
        navigate(`/courses/${courseId}/add-chapter`);
      } else {
        // En caso contrario: volver al listado de módulos
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
          <label>Miniatura (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
              setThumbnail(f);
            }}
          />
        </div>

        <div>
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Curso'}</button>
        </div>
      </form>
    </div>
  );
}
