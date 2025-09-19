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
  name: { type: String},
  phone: { type: String},
  email: { type: String, required: true, unique: true },
  gender: { type: String},
  birth: { type: Date },
  password: { type: String, required: true },
  mssv: { type: String },
  coin: { type: Number, default: 0 }
}, { timestamps: true });

const GuestModel = mongoose.model('users', guestSchema);

const userFieldsToReturn = 'email name phone mssv gender coin -_id';

//Post route
app.post('/post', async (req, res) => {
    const { mode, email, password, name, phone, mssv, gender, birthString, coin } = req.body;
    const numericMode = parseInt(mode, 10);
    switch (numericMode) {
        // Case 1: Register
        case 1:
            try {
                const existingUser = await GuestModel.findOne({ email: email });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: 'Your email is already in use',
                    });
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const newUser = new GuestModel({
                    email: email,
                    password: hashedPassword,
                    coin: 1000,
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
                return res.status(500).json({
                    success: false,
                    message: `Server error with received data: ${JSON.stringify(req.body)}`
                });
            }
        // Case 2: Login
        case 2:
            try {
                const trimmedEmail = email.trim();
                const user = await GuestModel.findOne({ email: trimmedEmail });

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
                const userResponse = {
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    mssv: user.mssv,
                    gender: user.gender,
                    coin: user.coin
                };

                return res.status(200).json({
                    success: true,
                    user: userResponse,
                    birthdate: user.birth
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: `Server error: ${error.message}`
                });
            }

        // Case 3: update user information
        case 3:
            try {
                const userEmail = req.body.email;
                const updateFields = {
                    name: name,
                    phone: phone,
                    mssv: mssv,
                    gender: gender,
                    birth: birthString,
                    coin: coin
                };

                const updatedUser = await GuestModel.findOneAndUpdate(
                    { email: userEmail },
                    { $set: updateFields },
                    { new: true }
                ).select('-password -email');

                if (!updatedUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'User with this email not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'User information updated successfully',
                    user: updatedUser
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: `Server error with received data: ${JSON.stringify(req.body)}`
                });
            }
        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid mode specified. Please provide a valid mode (1, 2, or 3).'
            });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});