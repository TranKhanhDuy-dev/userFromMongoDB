const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simple_db')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));

const guestSchema = new mongoose.Schema({
  username: { type: String},
  phone: { type: String},
  email: { type: String, required: true, unique: true },
  gender: { type: String},
  birth: { type: Date },
  password: { type: String, required: true }
}, { timestamps: true });

const GuestModel = mongoose.model('users', guestSchema);

//Register route
app.post('/register', async (req, res) => {
    const {email, password} = req.body;

    try {
        const existingUser = await GuestModel.findOne({email: email});

        if (existingUser) {
            if (existingUser.email === email) {
                message = 'Your email is already in use';
            }
            return res.status(409).json({
                success: false,
                message: message,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new GuestModel({
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: 'Create account successfully',
            user: userResponse
        });

    } catch (error) {
        console.error("Lỗi server khi đăng ký:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

//Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const trimmedEmail = email.trim();
    const user = await GuestModel.findOne({ email: new RegExp('^' + trimmedEmail + '$', 'i') });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Wrong password',
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

//List route
app.get('/users', async (req, res) => {
    try {
        const users = await GuestModel.find({}).select('-password');

        return res.status(200).json({
            success: true,
            message: 'List of users retrieved successfully',
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error("Lỗi server khi lấy danh sách người dùng:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});