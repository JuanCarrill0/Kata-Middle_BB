/// <reference types="vite/client" />
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../services/api';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';

type CourseCategory = 'fullstack' | 'apis' | 'cloud' | 'data';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: CourseCategory;
  thumbnail: string;
}

const categoryColors = {
  fullstack: 'primary',
  apis: 'secondary',
  cloud: 'info',
  data: 'success',
} as const;

const Courses = () => {
  const { data: courses, isLoading } = useQuery<Course[]>(['courses'], () =>
    coursesApi.getAll().then((res) => res.data)
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cursos Disponibles
      </Typography>
      <Grid container spacing={3}>
        {courses?.map((course: Course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={`${import.meta.env.VITE_MINIO_URL}/${course.thumbnail}`}
                alt={course.title}
              />
              <CardContent>
                <Typography gutterBottom variant="h6">
                  {course.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {course.description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Chip
                    label={course.category}
                    color={categoryColors[course.category]}
                    size="small"
                  />
                  <Button
                    component={Link}
                    to={`/courses/${course._id}`}
                    variant="contained"
                    size="small"
                  >
                    Ver Curso
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Courses;