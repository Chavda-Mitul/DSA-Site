import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Checkbox,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import api from '../api/axios';
import { useProblems } from '../hooks/useProblems';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';
import type { Topic } from '../types/topic.types';
import type { Difficulty, Problem } from '../types/problem.types';

export const TopicDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [topic, setTopic] = useState<Topic | null>(null);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const { isCompleted, markCompleted, unmarkCompleted } = useProgress();

  const {
    problems,
    loading: problemsLoading,
    error: problemsError,
    pagination,
    currentPage,
    difficulty,
    fetchProblems,
    setDifficulty,
  } = useProblems(topic?._id || '');

  const triggerCelebration = (message: string) => {
    setCelebration({ show: true, message });
    setTimeout(() => {
      setCelebration({ show: false, message: '' });
    }, 2000);
  };

  useEffect(() => {
    const fetchTopic = async () => {
      if (!slug) return;

      setTopicLoading(true);
      setTopicError(null);

      try {
        const response = await api.get<{ success: boolean; data: Topic }>(`/topics/${slug}`);
        setTopic(response.data.data);
      } catch (err) {
        setTopicError(extractErrorMessage(err, 'Failed to load topic'));
      } finally {
        setTopicLoading(false);
      }
    };

    fetchTopic();
  }, [slug]);

  useEffect(() => {
    if (topic?._id) {
      fetchProblems(1);
    }
  }, [topic?._id, fetchProblems]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    fetchProblems(page);
  };

  const handleDifficultyChange = (event: any) => {
    setDifficulty(event.target.value as Difficulty | '');
  };

  const handleCheckboxChange = async (problem: Problem) => {
    const isCurrentlyCompleted = isCompleted(problem._id);
    
    setUpdatingIds((prev) => new Set(prev).add(problem._id));
    
    try {
      if (isCurrentlyCompleted) {
        await unmarkCompleted(problem._id);
      } else {
        await markCompleted(problem._id);
        const messages = [
          '🎉 Great job!',
          '⭐ Well done!',
          '💪 Keep it up!',
          '🔥 Awesome!',
          '✅ Problem crushed!',
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        triggerCelebration(randomMessage);
      }
    } catch {
      // Error is handled in context with rollback
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(problem._id);
        return newSet;
      });
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
      default:
        return 'default';
    }
  };

  if (topicLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (topicError || !topic) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {topicError || 'Topic not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/topics')}>
          Back to Topics
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/topics')}>
          Back to Topics
        </Button>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/problems/create?topicId=${topic._id}`)}
          >
            Add Problem
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {topic.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {topic.description}
        </Typography>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            label="Difficulty"
            onChange={handleDifficultyChange}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Easy">Easy</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Hard">Hard</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {problemsError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchProblems(currentPage)}>
              Retry
            </Button>
          }
        >
          {problemsError}
        </Alert>
      )}

      {problemsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !problems || problems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No problems available for this topic.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Check back later for problems.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: 50 }}>Done</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Difficulty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Links</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problems.map((problem) => (
                  <TableRow key={problem._id} hover>
                    <TableCell>
                      <Checkbox
                        checked={isCompleted(problem._id)}
                        onChange={() => handleCheckboxChange(problem)}
                        disabled={updatingIds.has(problem._id)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{problem.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={problem.difficulty}
                        color={getDifficultyColor(problem.difficulty)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {problem.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        {problem.youtubeUrl && (
                          <IconButton
                            size="small"
                            component="a"
                            href={problem.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="error"
                          >
                            <YouTubeIcon />
                          </IconButton>
                        )}
                        {problem.leetcodeUrl && (
                          <IconButton
                            size="small"
                            component="a"
                            href={problem.leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="warning"
                          >
                            <CodeIcon />
                          </IconButton>
                        )}
                        {problem.articleUrl && (
                          <IconButton
                            size="small"
                            component="a"
                            href={problem.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                          >
                            <ArticleIcon />
                          </IconButton>
                        )}
                        {!problem.youtubeUrl && !problem.leetcodeUrl && !problem.articleUrl && (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={celebration.show}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          '& .MuiSnackbar-content': {
            background: 'linear-gradient(90deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c7, #ff0000)',
            backgroundSize: '400% 400%',
            animation: 'rainbow 1.5s ease infinite',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            padding: '16px 24px',
            borderRadius: '12px',
            color: 'white',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            '@keyframes rainbow': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
          }
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          {celebration.message}
        </Typography>
      </Snackbar>
    </Box>
  );
};
