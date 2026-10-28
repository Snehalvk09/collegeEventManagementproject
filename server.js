// server.js

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/college-event-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// Mongoose Schemas
const Registration = mongoose.model('Registration', new mongoose.Schema({
    eventTitle: String,
    eventDate: String,
    name: String,
    email: String,
    timestamp: { type: Date, default: Date.now }
}));

const Feedback = mongoose.model('Feedback', new mongoose.Schema({
    name: String,
    email: String,
    feedback: String,
    suggestion: String,
    timestamp: { type: Date, default: Date.now }
}));

const Event = mongoose.model('Event', new mongoose.Schema({
    title: String,
    date: String,
    description: String,
    department: String,
    timestamp: { type: Date, default: Date.now }
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Dummy coordinator users
const users = [
    { username: 'cse_admin', password: 'cse123', department: 'CSE' },
    { username: 'it_admin', password: 'it123', department: 'IT' },
    { username: 'ece_admin', password: 'ece123', department: 'ECE' },
    { username: 'mech_admin', password: 'mech123', department: 'Mechanical' },
    { username: 'aids_admin', password: 'aids123', department: 'AIDS' }
];

// Static Page Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.get('/admin-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/admin-login.html')));
app.get('/event-coordinator-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/event-coordinator-login.html')));
app.get('/student-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/student-login.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'views/admin-dashboard.html')));

// Department Login Pages
app.get('/cse-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/cse-login.html')));
app.get('/it-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/it-login.html')));
app.get('/ece-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/ece-login.html')));
app.get('/mech-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/mech-login.html')));
app.get('/aids-login.html', (req, res) => res.sendFile(path.join(__dirname, 'views/aids-login.html')));

// Department Dashboard Pages
app.get('/dashboard/cse', (req, res) => res.sendFile(path.join(__dirname, 'views/cse-dashboard.html')));
app.get('/dashboard/it', (req, res) => res.sendFile(path.join(__dirname, 'views/it-dashboard.html')));
app.get('/dashboard/ece', (req, res) => res.sendFile(path.join(__dirname, 'views/ece-dashboard.html')));
app.get('/dashboard/mech', (req, res) => res.sendFile(path.join(__dirname, 'views/mech-dashboard.html')));
app.get('/dashboard/aids', (req, res) => res.sendFile(path.join(__dirname, 'views/aids-dashboard.html')));

// Login Route (Admin + Coordinators)
app.post('/login', (req, res) => {
    const { username, password, department } = req.body;

    if (username === 'admin' && password === '1234' && department === 'admin') {
        return res.json({ success: true, redirectUrl: '/admin-dashboard.html' });
    }

    const user = users.find(u =>
        u.username === username &&
        u.password === password &&
        u.department.toLowerCase() === department.toLowerCase()
    );

    if (user) {
        const deptSlug = department.toLowerCase();
        const redirectRoute = `/dashboard/${deptSlug === 'mechanical' ? 'mech' : deptSlug}`;
        return res.json({ success: true, redirectUrl: redirectRoute });
    }

    res.json({ success: false, message: 'Invalid username, password, or department' });
});

// Add Event (Coordinator)
app.post('/api/events', async (req, res) => {
    const { title, date, description, department } = req.body;

    if (!title || !date || !description || !department) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        await Event.create({ title, date, description, department });
        res.json({ success: true, message: "Event added successfully" });
    } catch (err) {
        console.error("Error saving event:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get All Events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching events" });
    }
});

// Student Registration
app.post('/register', async (req, res) => {
    const { eventTitle, eventDate, name, email } = req.body;

    if (!eventTitle || !eventDate || !name || !email) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        await Registration.create({ eventTitle, eventDate, name, email });
        res.json({ success: true, message: "Registration successful" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Feedback Submission
app.post('/feedback', async (req, res) => {
    const { name, email, feedback, suggestion } = req.body;

    if (!name || !email || !feedback) {
        return res.status(400).json({ success: false, message: "Name, email, and feedback are required" });
    }

    try {
        await Feedback.create({ name, email, feedback, suggestion });
        res.json({ success: true, message: "Feedback received" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get All Registrations
app.get('/registrations', async (req, res) => {
    try {
        const data = await Registration.find().sort({ timestamp: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching registrations" });
    }
});

// Get All Feedbacks
app.get('/feedbacks', async (req, res) => {
    try {
        const data = await Feedback.find().sort({ timestamp: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching feedbacks" });
    }
});

// 404 Fallback
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});



