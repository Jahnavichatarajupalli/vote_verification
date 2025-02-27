const axios = require('axios');

const createInitialOfficer = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'admin',
            password: 'admin123',
            name: 'Admin Officer',
            pollingStation: 'Main Station'
        });

        console.log('Officer created successfully:', response.data.officer);
        console.log('Token:', response.data.token);
    } catch (error) {
        console.error('Error creating officer:', error.response?.data || error.message);
    }
};

createInitialOfficer();
