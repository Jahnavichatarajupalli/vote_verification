document.addEventListener('DOMContentLoaded', function() {
    // API Base URL
    const API_BASE_URL = 'http://localhost:5000';

    // Tab switching functionality
    const tabs = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab') + 'Form';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Photo preview functionality
    const photoInput = document.getElementById('voterPhoto');
    const photoPreview = document.getElementById('photoPreview');

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Show alert function
    function showAlert(message, isSuccess = true) {
        const alertElement = document.getElementById(isSuccess ? 'successAlert' : 'errorAlert');
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }

    // Test API connection
    fetch(`${API_BASE_URL}/api/test`)
        .then(response => response.json())
        .then(data => console.log('API Test:', data))
        .catch(error => console.error('API Test Error:', error));

    // Form submission handlers
    document.getElementById('addVoterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Submitting voter form');
        
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/addVoter`, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                showAlert('Voter added successfully!', true);
                e.target.reset();
                photoPreview.style.display = 'none';
            } else {
                showAlert(data.message || 'Error adding voter', false);
            }
        } catch (error) {
            console.error('Error submitting voter form:', error);
            showAlert('Error connecting to server', false);
        }
    });

    document.getElementById('addOfficerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Submitting officer form');
        
        const formData = new FormData(e.target);
        const officerData = {};
        formData.forEach((value, key) => {
            if (key === 'age') {
                officerData[key] = parseInt(value);
            } else {
                officerData[key] = value;
            }
        });

        console.log('Officer data:', officerData);

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/addOfficer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(officerData)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error adding officer');
            }

            const data = await response.json();
            console.log('Response data:', data);
            showAlert('Officer added successfully!', true);
            e.target.reset();
        } catch (error) {
            console.error('Error submitting officer form:', error);
            showAlert(error.message || 'Error connecting to server', false);
        }
    });
});
