const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();  // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Use JWT_SECRET from the .env
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {type: String, required: true, unique: true},
  password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Task = mongoose.model('Task', taskSchema);

// User Registration
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
      console.log('Received registration request:', username, email, password); 

      let user = await User.findOne({ username });
      if (user) {
          console.log('User already exists'); // Debugging line
          return res.status(400).json({ message: 'User already exists' });
      }

      user = new User({ username, email, password });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '1h',
      });

      console.log('User registered successfully:', user.username); 

      res.json({ token });
  } catch (err) {
      console.error('Registration error:', err); // Debugging line
      res.status(500).json({ message: 'Server error' });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to Authenticate Token
const authenticateToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get Tasks for Logged-in User
app.get('/tasks', authenticateToken, async (req, res) => {
  const tasks = await Task.find({ userId: req.user });
  res.json(tasks);
});

// Create a New Task for Logged-in User
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
      console.log('Received task creation request:', req.body.text); 

      const task = new Task({
          text: req.body.text,
          userId: req.user,  
      });

      await task.save();

      console.log('Task created successfully:', task);

      res.json(task);
  } catch (err) {
      console.error('Error creating task:', err); 
      res.status(500).json({ message: 'Server error' });
  }
});



// Update a Task
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
      const { id } = req.params;
      const updatedTask = await Task.findOneAndUpdate(
          { _id: id, userId: req.user },  
          { text: req.body.text },
          { new: true }  
      );

      if (!updatedTask) {
          return res.status(404).json({ message: 'Task not found' });
      }

      res.json(updatedTask);
  } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ message: 'Server error' });
  }
});


// Delete a Task
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await Task.findOneAndDelete({ _id: id, userId: req.user });
  res.json({ message: 'Task deleted' });
});

// Start the server
app.listen(5000, () => console.log('Server running on port 5000'));
