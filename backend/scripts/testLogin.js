const axios = require('axios');

const testLogin = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        console.log('Login successful!');
        console.log('Token:', response.data.token);
        console.log('Officer details:', response.data.officer);

        // Test protected route
        const protectedResponse = await axios.get('http://localhost:5000/api/auth/officer', {
            headers: {
                'x-auth-token': response.data.token
            }
        });

        console.log('\nProtected route test successful!');
        console.log('Officer data:', protectedResponse.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

testLogin();
