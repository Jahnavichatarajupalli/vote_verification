require('dotenv').config();
const mongoose = require('mongoose');
const Officer = require('../models/Officer');
const Voter = require('../models/Voter');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Sample Officers Data
const officers = [
    {
        name: "John Smith",
        phoneNumber: "9876543210",
        pollingStation: "PS001",
        job: "Presiding Officer",
        age: 35,
        gender: "Male"
    },
    {
        name: "Sarah Johnson",
        phoneNumber: "9876543211",
        pollingStation: "PS002",
        job: "Polling Officer",
        age: 30,
        gender: "Female"
    },
    {
        name: "Michael Brown",
        phoneNumber: "9876543212",
        pollingStation: "PS003",
        job: "Presiding Officer",
        age: 40,
        gender: "Male"
    },
    {
        name: "Emily Davis",
        phoneNumber: "9876543213",
        pollingStation: "PS001",
        job: "Polling Officer",
        age: 28,
        gender: "Female"
    }
];

// Sample Voters Data
const voters = [
    {
        name: "Alice Wilson",
        epicNo: "ABC1234567",
        age: 25,
        address: "123 Main St, City",
        gender: "Female",
        photo: "https://example.com/photos/alice.jpg",
        hasVoted: false,
        pollingStation: "PS001"
    },
    {
        name: "Bob Anderson",
        epicNo: "DEF1234567",
        age: 35,
        address: "456 Oak St, City",
        gender: "Male",
        photo: "https://example.com/photos/bob.jpg",
        hasVoted: false,
        pollingStation: "PS001"
    },
    {
        name: "Carol Martinez",
        epicNo: "GHI1234567",
        age: 45,
        address: "789 Pine St, City",
        gender: "Female",
        photo: "https://example.com/photos/carol.jpg",
        hasVoted: false,
        pollingStation: "PS002"
    },
    {
        name: "David Taylor",
        epicNo: "JKL1234567",
        age: 28,
        address: "321 Elm St, City",
        gender: "Male",
        photo: "https://example.com/photos/david.jpg",
        hasVoted: false,
        pollingStation: "PS002"
    },
    {
        name: "Eva Garcia",
        epicNo: "MNO1234567",
        age: 32,
        address: "654 Maple St, City",
        gender: "Female",
        photo: "https://example.com/photos/eva.jpg",
        hasVoted: false,
        pollingStation: "PS003"
    },
    {
        name: "Frank Rodriguez",
        epicNo: "PQR1234567",
        age: 50,
        address: "987 Cedar St, City",
        gender: "Male",
        photo: "https://example.com/photos/frank.jpg",
        hasVoted: false,
        pollingStation: "PS001"
    },
    {
        name: "Grace Lee",
        epicNo: "STU1234567",
        age: 29,
        address: "741 Birch St, City",
        gender: "Female",
        photo: "https://example.com/photos/grace.jpg",
        hasVoted: false,
        pollingStation: "PS002"
    },
    {
        name: "Henry Wilson",
        epicNo: "VWX1234567",
        age: 42,
        address: "852 Walnut St, City",
        gender: "Male",
        photo: "https://example.com/photos/henry.jpg",
        hasVoted: false,
        pollingStation: "PS003"
    },
    {
        name: "Isabella Clark",
        epicNo: "YZA1234567",
        age: 38,
        address: "963 Pine St, City",
        gender: "Female",
        photo: "https://example.com/photos/isabella.jpg",
        hasVoted: false,
        pollingStation: "PS001"
    },
    {
        name: "Jack Thompson",
        epicNo: "BCD1234567",
        age: 55,
        address: "159 Oak St, City",
        gender: "Male",
        photo: "https://example.com/photos/jack.jpg",
        hasVoted: false,
        pollingStation: "PS002"
    }
];

// Function to seed the database
async function seedDatabase() {
    try {
        // Clear existing data
        await Officer.deleteMany({});
        await Voter.deleteMany({});

        // Insert new data
        await Officer.insertMany(officers);
        await Voter.insertMany(voters);

        console.log('Database seeded successfully!');
        console.log(`Added ${officers.length} officers and ${voters.length} voters.`);
        console.log('\nOfficers by Polling Station:');
        for (const ps of [...new Set(officers.map(o => o.pollingStation))]) {
            const count = officers.filter(o => o.pollingStation === ps).length;
            console.log(`${ps}: ${count} officers`);
        }
        console.log('\nVoters by Polling Station:');
        for (const ps of [...new Set(voters.map(v => v.pollingStation))]) {
            const count = voters.filter(v => v.pollingStation === ps).length;
            console.log(`${ps}: ${count} voters`);
        }

        // Exit process
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedDatabase();
