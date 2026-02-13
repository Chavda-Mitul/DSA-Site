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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adminTopicService } from '../../services/adminTopicService';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { extractErrorMessage } from '../../utils/errorUtils';
import type { Topic, PaginationInfo } from '../../types/topic.types';

export const ManageTopics = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; topic: Topic | null }>({
    open: false,
    topic: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminTopicService.getTopics(currentPage, 10, includeInactive);
      setTopics(result.topics);
      setPagination(result.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch topics'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, includeInactive]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (topic: Topic) => {
    setDeleteModal({ open: true, topic });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.topic) return;

    setDeleting(true);
    try {
      await adminTopicService.deleteTopic(deleteModal.topic._id);
      setDeleteModal({ open: false, topic: null });
      fetchTopics();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete topic'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, topic: null });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Topics</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/topics/create')}
        >
          Add Topic
        </Button>
      </Box>

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
        label="Show inactive topics"
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchTopics}>
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
      ) : topics.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No topics found.
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Problems</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((topic) => (
                  <TableRow key={topic._id} hover>
                    <TableCell>{topic.order}</TableCell>
                    <TableCell>{topic.title}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topic.description}
                    </TableCell>
                    <TableCell>{topic.slug}</TableCell>
                    <TableCell>
                      <Chip
                        label={topic.isActive ? 'Active' : 'Inactive'}
                        color={topic.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{topic.problemCount || 0}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/admin/topics/${topic._id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(topic)}
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
        title="Delete Topic"
        description={`Are you sure you want to delete "${deleteModal.topic?.title}"? This is a soft delete and can be reverted.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        loading={deleting}
      />
    </Box>
  );
};
