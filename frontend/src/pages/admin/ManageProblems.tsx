import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adminProblemService } from '../../services/adminProblemService';
import { adminTopicService } from '../../services/adminTopicService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { Problem, PaginationInfo, Difficulty } from '../../types/problem.types';
import type { Topic } from '../../types/topic.types';

export const ManageProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | ''>('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; problem: Problem | null }>({
    open: false,
    problem: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    try {
      const result = await adminTopicService.getTopics(1, 100, true);
      setTopics(result.topics);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  }, []);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminProblemService.getProblems({
        page: currentPage,
        limit: 10,
        topicId: filterTopic || undefined,
        difficulty: filterDifficulty || undefined,
        includeInactive,
      });
      setProblems(result.problems);
      setPagination(result.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch problems'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterTopic, filterDifficulty, includeInactive]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (problem: Problem) => {
    setDeleteModal({ open: true, problem });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.problem) return;

    setDeleting(true);
    try {
      await adminProblemService.deleteProblem(deleteModal.problem._id);
      setDeleteModal({ open: false, problem: null });
      fetchProblems();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete problem'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, problem: null });
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

  const getTopicTitle = (topicId: string | { _id: string; title: string; slug: string }) => {
    if (!topicId) return '';
    if (typeof topicId === 'object') return topicId.title || '';
    if (!topics || topics.length === 0) return topicId;
    const topic = topics.find(t => t._id === topicId);
    return topic?.title || topicId;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Problems</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/problems/create')}
        >
          Add Problem
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Topic</InputLabel>
          <Select
            value={filterTopic}
            label="Topic"
            onChange={(e) => {
              setFilterTopic(e.target.value);
              setCurrentPage(1);
            }}
          >
            <MenuItem value="">All Topics</MenuItem>
            {topics.map((topic) => (
              <MenuItem key={topic._id} value={topic._id}>
                {topic.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={filterDifficulty}
            label="Difficulty"
            onChange={(e) => {
              setFilterDifficulty(e.target.value as Difficulty | '');
              setCurrentPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Easy">Easy</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Hard">Hard</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setCurrentPage(1);
              }}
            />
          }
          label="Show inactive"
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchProblems}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : problems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No problems found.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Difficulty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problems.map((problem) => (
                  <TableRow key={problem._id} hover>
                    <TableCell>{problem.order}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {problem.title}
                    </TableCell>
                    <TableCell>{getTopicTitle(problem.topicId)}</TableCell>
                    <TableCell>
                      <Chip
                        label={problem.difficulty}
                        color={getDifficultyColor(problem.difficulty)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {problem.tags.slice(0, 2).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                      ))}
                      {problem.tags.length > 2 && (
                        <Typography variant="caption">+{problem.tags.length - 2}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={problem.isActive ? 'Active' : 'Inactive'}
                        color={problem.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/admin/problems/${problem._id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(problem)}
                      >
                        <DeleteIcon />
                      </IconButton>
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

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Problem"
        description={`Are you sure you want to delete "${deleteModal.problem?.title}"? This is a soft delete and can be reverted.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        loading={deleting}
      />
    </Box>
  );
};
