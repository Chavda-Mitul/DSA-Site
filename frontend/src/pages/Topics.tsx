import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Box,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTopics } from '../hooks/useTopics';
import { progressService, type ProgressSummary } from '../services/progressService';
import { useAuth } from '../context/AuthContext';

export const Topics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { topics, loading, error, pagination, fetchTopics } = useTopics();
  const [currentPage, setCurrentPage] = useState(1);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    fetchTopics(currentPage);
  }, [fetchTopics, currentPage]);

  useEffect(() => {
    const fetchProgressSummary = async () => {
      try {
        const summary = await progressService.getSummary();
        setProgressSummary(summary);
      } catch {
        // Silently fail - progress is optional
      }
    };

    fetchProgressSummary();
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleTopicClick = (slug: string) => {
    navigate(`/topics/${slug}`);
  };

  const getTopicProgress = (topicId: string) => {
    if (!progressSummary || !progressSummary.topicProgress) return null;
    return progressSummary.topicProgress.find(tp => tp.topicId === topicId);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
            <Button color="inherit" size="small" onClick={() => fetchTopics(currentPage)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (topics?.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No topics available yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" component="h1">
          Topics
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/topics/create')}
          >
            Add Topic
          </Button>
        )}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Choose a topic to start practicing
      </Typography>

      <Grid container spacing={3}>
        {topics.map((topic) => {
          const topicProgress = getTopicProgress(topic._id);
          const hasProgress = topicProgress && topicProgress.totalProblems > 0;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleTopicClick(topic.slug)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {topic.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.description}
                  </Typography>
                  
                  {hasProgress && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {topicProgress.completedProblems}/{topicProgress.totalProblems}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={topicProgress.percentage}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}
                  
                  {!hasProgress && topic.problemCount !== undefined && topic.problemCount > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {topic.problemCount} problems
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicClick(topic.slug);
                    }}
                  >
                    View Problems
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};
