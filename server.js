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
  address: { type: String},
  gender: { type: String},
  birth: { type: Date },
  password: { type: String, required: true }
}, { timestamps: true });

const GuestModel = mongoose.model('users', guestSchema);

//User route
app.post('/post', async (req, res) => {
    const { id, email, password, name, address, phone, gender, birth} = req.body;
    const numericId = parseInt(id, 10);
    // 1: Register
    if (numericId  === 1) {
      try {
          const existingUser = await GuestModel.findOne({email: email});

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
    }
    // 2: Login
    else if(numericId === 2) {
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

        return res.status(200).json({
          success: true
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
        });
      }
    }
    //3: Add information
    else if(numericId === 3) {
      try {
        const userEmail = req.body.email;
        const updateFields = {};
        updateFields.username = name;
        updateFields.phone = phone;
        updateFields.address = address;
        updateFields.gender = gender;
        updateFields.birth = birth;

        const updatedUser = await GuestModel.findOneAndUpdate(
            { email: userEmail },
            {$set: updateFields },
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
          message: 'Server error'
        });
      }
    }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});