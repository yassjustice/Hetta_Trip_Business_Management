import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as ValidateAllIcon,
  FileUpload as ImportIcon
} from '@mui/icons-material';
import ResearchResultTable from './ResearchResultTable';
import ResearchValidationModal from './ResearchValidationModal';
import ResearchImportModal from './ResearchImportModal';

const ResearchResults = ({ sessionId }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [selectedResults, setSelectedResults] = useState([]);
  
  // Modal states
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  
  // Loading states
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch session details and results
      const sessionResponse = await fetch(`/api/research/sessions/${sessionId}`);
      if (!sessionResponse.ok) throw new Error('Failed to fetch session');
      const sessionData = await sessionResponse.json();
      setSession(sessionData);

      const resultsResponse = await fetch(`/api/research/sessions/${sessionId}/results`);
      if (!resultsResponse.ok) throw new Error('Failed to fetch results');
      const resultsData = await resultsResponse.json();
      setResults(resultsData);
      
    } catch (err) {
      setError('Failed to load research results');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateResult = (result) => {
    setCurrentResult(result);
    setValidationModalOpen(true);
  };

  const handleViewResult = (result) => {
    setCurrentResult(result);
    setValidationModalOpen(true);
  };

  const handleSaveValidation = async (updatedResult) => {
    try {
      setValidating(true);
      
      const response = await fetch(`/api/research/results/${updatedResult._id}/validate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedResult)
      });

      if (!response.ok) throw new Error('Failed to save validation');

      // Update local state
      setResults(prev => prev.map(r => 
        r._id === updatedResult._id ? updatedResult : r
      ));

      setValidationModalOpen(false);
      setCurrentResult(null);
      
    } catch (err) {
      console.error('Error saving validation:', err);
      setError('Failed to save validation');
    } finally {
      setValidating(false);
    }
  };

  const handleBulkValidate = async () => {
    try {
      setValidating(true);
      
      const response = await fetch(`/api/research/sessions/${sessionId}/validate-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resultIds: selectedResults })
      });

      if (!response.ok) throw new Error('Failed to validate results');

      await fetchResults(); // Refresh results
      setSelectedResults([]); // Clear selection
      
    } catch (err) {
      console.error('Error bulk validating:', err);
      setError('Failed to validate selected results');
    } finally {
      setValidating(false);
    }
  };

  const handleImportResults = async (resultsToImport, importSettings) => {
    try {
      setImporting(true);
      
      const response = await fetch(`/api/research/sessions/${sessionId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          results: resultsToImport,
          settings: importSettings
        })
      });

      if (!response.ok) throw new Error('Failed to import results');

      const importedData = await response.json();
      console.log('Import successful:', importedData);
      
      // Refresh results to update import status
      await fetchResults();
      setSelectedResults([]); // Clear selection
      
    } catch (err) {
      console.error('Error importing results:', err);
      throw err; // Re-throw for modal to handle
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const validatedResults = results.filter(r => r.validationStatus === 'validated');
  const pendingResults = results.filter(r => r.validationStatus === 'pending');
  const needsReviewResults = results.filter(r => r.validationStatus === 'needs_review');
  const selectedValidatedResults = selectedResults.filter(id => 
    results.find(r => r._id === id)?.validationStatus === 'validated'
  );

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" gutterBottom>
            Research Results
          </Typography>
          {session && (
            <Typography variant="body2" color="textSecondary">
              Session: {session.searchTerms?.join(', ')} • {results.length} results found
            </Typography>
          )}
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchResults}
            disabled={loading}
          >
            Refresh
          </Button>
          {selectedResults.length > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<ValidateAllIcon />}
                onClick={handleBulkValidate}
                disabled={validating}
              >
                Validate Selected ({selectedResults.length})
              </Button>
              <Button
                variant="contained"
                startIcon={<ImportIcon />}
                onClick={() => setImportModalOpen(true)}
                disabled={selectedValidatedResults.length === 0}
              >
                Import Selected ({selectedValidatedResults.length})
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => setImportModalOpen(true)}
            disabled={validatedResults.length === 0}
          >
            Import All Validated ({validatedResults.length})
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {results.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Results
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {validatedResults.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Validated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {needsReviewResults.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Needs Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {Math.round((validatedResults.length / results.length) * 100) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Validation Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Table */}
      {results.length > 0 ? (
        <ResearchResultTable
          results={results}
          selectedResults={selectedResults}
          onSelectionChange={setSelectedResults}
          onValidateResult={handleValidateResult}
          onViewResult={handleViewResult}
          loading={loading}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No results found for this research session.
          </Typography>
        </Box>
      )}

      {/* Validation Modal */}
      <ResearchValidationModal
        open={validationModalOpen}
        onClose={() => {
          setValidationModalOpen(false);
          setCurrentResult(null);
        }}
        result={currentResult}
        onSave={handleSaveValidation}
        loading={validating}
      />

      {/* Import Modal */}
      <ResearchImportModal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setSelectedResults([]);
        }}
        selectedResults={
          selectedValidatedResults.length > 0 
            ? results.filter(r => selectedValidatedResults.includes(r._id))
            : validatedResults
        }
        onImport={handleImportResults}
        loading={importing}
      />
    </Paper>
  );
};

export default ResearchResults;
