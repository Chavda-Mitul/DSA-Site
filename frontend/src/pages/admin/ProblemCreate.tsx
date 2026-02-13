import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { adminProblemService, type ProblemFormData } from '../../services/adminProblemService';
import { adminTopicService } from '../../services/adminTopicService';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { Topic } from '../../types/topic.types';
import type { Difficulty } from '../../types/problem.types';

interface ProblemFormValues {
  title: string;
  topicId: string;
  difficulty: Difficulty;
  order: string;
  tags: string;
  youtubeUrl: string;
  leetcodeUrl: string;
  articleUrl: string;
}

export const ProblemCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicIdParam = searchParams.get('topicId') || '';
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fetchingTopics, setFetchingTopics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<ProblemFormValues>({
    title: '',
    topicId: topicIdParam,
    difficulty: 'Easy',
    order: '',
    tags: '',
    youtubeUrl: '',
    leetcodeUrl: '',
    articleUrl: '',
  });
  const [errors, setErrors] = useState<Partial<ProblemFormValues>>({});

  useEffect(() => {
    const fetchTopics = async () => {
      setFetchingTopics(true);
      try {
        const result = await adminTopicService.getTopics(1, 100, true);
        setTopics(result.topics);
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      } finally {
        setFetchingTopics(false);
      }
    };

    fetchTopics();
  }, []);

  const handleChange = (field: keyof ProblemFormValues) => (e: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }) => {
    const value = e.target.value as string;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSelectChange = (field: keyof ProblemFormValues) => (e: any) => {
    const value = e.target.value as string;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<ProblemFormValues> = {};
    if (!values.title.trim()) newErrors.title = 'Title is required';
    if (!values.topicId) newErrors.topicId = 'Topic is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const data: ProblemFormData = {
        title: values.title,
        topicId: values.topicId,
        difficulty: values.difficulty,
        order: values.order ? parseInt(values.order, 10) : undefined,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        youtubeUrl: values.youtubeUrl || undefined,
        leetcodeUrl: values.leetcodeUrl || undefined,
        articleUrl: values.articleUrl || undefined,
      };
      await adminProblemService.createProblem(data);
      navigate('/admin/problems');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create problem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/problems')}
        sx={{ mb: 3 }}
      >
        Back to Problems
      </Button>

      <Typography variant="h4" gutterBottom>
        Create Problem
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
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
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Order"
                value={values.order}
                onChange={handleChange('order')}
                error={!!errors.order}
                helperText={errors.order || 'Optional'}
                margin="normal"
                type="number"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required error={!!errors.topicId}>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={values.topicId}
                  label="Topic"
                  onChange={handleSelectChange('topicId')}
                  disabled={fetchingTopics}
                  renderValue={(value) => {
                    if (!value) return '';
                    const selectedTopic = topics.find(t => t._id === value);
                    return selectedTopic?.title || value;
                  }}
                >
                  {topics.map((topic) => (
                    <MenuItem key={topic._id} value={topic._id}>
                      {topic.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal" required error={!!errors.difficulty}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={values.difficulty}
                  label="Difficulty"
                  onChange={handleSelectChange('difficulty')}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Tags"
                value={values.tags}
                onChange={handleChange('tags')}
                error={!!errors.tags}
                helperText={errors.tags || 'Comma separated (e.g., array, dynamic programming)'}
                margin="normal"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="YouTube URL"
                value={values.youtubeUrl}
                onChange={handleChange('youtubeUrl')}
                error={!!errors.youtubeUrl}
                helperText={errors.youtubeUrl}
                margin="normal"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="LeetCode URL"
                value={values.leetcodeUrl}
                onChange={handleChange('leetcodeUrl')}
                error={!!errors.leetcodeUrl}
                helperText={errors.leetcodeUrl}
                margin="normal"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Article URL"
                value={values.articleUrl}
                onChange={handleChange('articleUrl')}
                error={!!errors.articleUrl}
                helperText={errors.articleUrl}
                margin="normal"
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || fetchingTopics}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Create Problem
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/problems')}
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
