import { useEffect, useState, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  LinearProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { progressService, type ProgressSummary } from '../services/progressService';
import { extractErrorMessage } from '../utils/errorUtils';

export const Dashboard = () => {
  const { user } = useAuth();
  const { completedIds, refreshProgress } = useProgress();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevCompletedCount = useRef(completedIds.size);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await progressService.getSummary();
      setSummary(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load progress'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Refetch summary when progress changes
  useEffect(() => {
    // Skip initial render - only refetch when completedIds actually changes
    if (completedIds.size !== prevCompletedCount.current) {
      prevCompletedCount.current = completedIds.size;
      fetchSummary();
    }
  }, [completedIds.size]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!summary) {
    return null;
  }

  const topicProgress = summary.topicProgress || [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.name}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: '100%', mr: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={summary.overallPercentage || 0}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>
              <Box sx={{ minWidth: 50 }}>
                <Typography variant="h6" color="primary">
                  {summary.overallPercentage || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {summary.completedProblems || 0} of {summary.totalProblems || 0} problems completed
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body1">
                <strong>Total Problems:</strong> {summary.totalProblems || 0}
              </Typography>
              <Typography variant="body1">
                <strong>Completed:</strong> {summary.completedProblems || 0}
              </Typography>
              <Typography variant="body1">
                <strong>Remaining:</strong> {(summary.totalProblems || 0) - (summary.completedProblems || 0)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Topic Breakdown
      </Typography>

      {topicProgress.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No topics available yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {topicProgress.map((topic) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic.topicId}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {topic.topicTitle}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={topic.percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 40 }}>
                    <Typography variant="body2" color="text.secondary">
                      {topic.percentage}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {topic.completedProblems} / {topic.totalProblems} problems
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
