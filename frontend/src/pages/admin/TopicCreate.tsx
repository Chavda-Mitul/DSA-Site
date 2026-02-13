import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { adminTopicService, type TopicFormData } from '../../services/adminTopicService';
import { extractErrorMessage } from '../../utils/errorUtils';

interface TopicFormValues {
  title: string;
  description: string;
  order: string;
}

const initialValues: TopicFormValues = {
  title: '',
  description: '',
  order: '',
};

export const TopicCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<TopicFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<TopicFormValues>>({});

  const handleChange = (field: keyof TopicFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<TopicFormValues> = {};
    if (!values.title.trim()) newErrors.title = 'Title is required';
    if (!values.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const data: TopicFormData = {
        title: values.title,
        description: values.description,
        order: values.order ? parseInt(values.order, 10) : undefined,
      };
      await adminTopicService.createTopic(data);
      navigate('/admin/topics');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create topic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/topics')}
        sx={{ mb: 3 }}
      >
        Back to Topics
      </Button>

      <Typography variant="h4" gutterBottom>
        Create Topic
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            value={values.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={values.description}
            onChange={handleChange('description')}
            error={!!errors.description}
            helperText={errors.description}
            margin="normal"
            multiline
            rows={3}
            required
          />

          <TextField
            fullWidth
            label="Order"
            value={values.order}
            onChange={handleChange('order')}
            error={!!errors.order}
            helperText={errors.order || 'Optional. Auto-assigned if not provided.'}
            margin="normal"
            type="number"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Create Topic
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/topics')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
