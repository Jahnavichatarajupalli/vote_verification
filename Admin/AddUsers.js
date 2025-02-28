import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AddUsers = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [voterData, setVoterData] = useState({
    name: '',
    epicNo: '',
    age: '',
    gender: '',
    address: '',
    pollingStation: ''
  });

  const [officerData, setOfficerData] = useState({
    name: '',
    phoneNumber: '',
    job: '',
    pollingStation: '',
    age: '',
    gender: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVoterChange = (e) => {
    setVoterData({
      ...voterData,
      [e.target.name]: e.target.value
    });
  };

  const handleOfficerChange = (e) => {
    setOfficerData({
      ...officerData,
      [e.target.name]: e.target.value
    });
  };

  const handleVoterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/admin/addVoter', voterData);
      setSnackbar({
        open: true,
        message: 'Voter added successfully!',
        severity: 'success'
      });
      // Clear form
      setVoterData({
        name: '',
        epicNo: '',
        age: '',
        gender: '',
        address: '',
        pollingStation: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding voter',
        severity: 'error'
      });
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting officer data:', officerData);
      const response = await axios.post('http://localhost:5001/api/admin/addOfficer', officerData);
      setSnackbar({
        open: true,
        message: 'Officer added successfully!',
        severity: 'success'
      });
      // Clear form
      setOfficerData({
        name: '',
        phoneNumber: '',
        job: '',
        pollingStation: '',
        age: '',
        gender: ''
      });
    } catch (error) {
      console.error('Error response:', error.response?.data);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding officer',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Add Users
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Add Voter" />
            <Tab label="Add Officer" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleVoterSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={voterData.name}
                  onChange={handleVoterChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="EPIC Number"
                  name="epicNo"
                  value={voterData.epicNo}
                  onChange={handleVoterChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={voterData.age}
                  onChange={handleVoterChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={voterData.gender}
                    onChange={handleVoterChange}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={voterData.address}
                  onChange={handleVoterChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Polling Station"
                  name="pollingStation"
                  value={voterData.pollingStation}
                  onChange={handleVoterChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                >
                  Add Voter
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleOfficerSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={officerData.name}
                  onChange={handleOfficerChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={officerData.phoneNumber}
                  onChange={handleOfficerChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job"
                  name="job"
                  value={officerData.job}
                  onChange={handleOfficerChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Polling Station"
                  name="pollingStation"
                  value={officerData.pollingStation}
                  onChange={handleOfficerChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={officerData.age}
                  onChange={handleOfficerChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={officerData.gender}
                    onChange={handleOfficerChange}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                >
                  Add Officer
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddUsers;
