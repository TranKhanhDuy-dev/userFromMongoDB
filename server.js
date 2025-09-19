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
    name: { type: String },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    gender: { type: String },
    birth: { type: Date },
    password: { type: String, required: true },
    mssv: { type: String },
    coin: { type: Number, default: 0 }
}, { timestamps: true });

const GuestModel = mongoose.model('users', guestSchema);

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

                const userResponse = {
                    email: savedUser.email,
                    name: savedUser.name,
                    phone: savedUser.phone,
                    mssv: savedUser.mssv,
                    gender: savedUser.gender,
                    coin: savedUser.coin
                };

                return res.status(201).json({
                    success: true,
                    message: 'Create account successfully',
                    user: userResponse,
                    birthdate: savedUser.birth
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: `Server error: ${error.message}`
                });
            }
            break;

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
            break;

        // Case 3: Update user information
        case 3:
            try {
                const updateFields = {};

                if (birthString) {
                    const parts = birthString.split('/');
                    if (parts.length === 3) {
                        updateFields.birth = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                }
                
                const numericCoin = parseInt(coin, 10);
                if (!isNaN(numericCoin)) {
                    updateFields.coin = numericCoin;
                }
                
                const updatedUser = await GuestModel.findOneAndUpdate(
                    { email: email },
                    { $set: updateFields },
                    { new: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'User with this email not found to update'
                    });
                }

                const userResponse = {
                    email: updatedUser.email,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    mssv: updatedUser.mssv,
                    gender: updatedUser.gender,
                    coin: updatedUser.coin
                };
                
                return res.status(200).json({
                    success: true,
                    user: userResponse,
                    birthdate: updatedUser.birth
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: `Server error: ${error.message}`
                });
            }
            break;

        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid mode specified. Please provide a valid mode.'
            });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});