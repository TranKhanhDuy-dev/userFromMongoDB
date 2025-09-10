const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza')
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err.message));

const guestSchema = new mongoose.Schema({
  guestname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  address: { type: String },
  password: { type: String, required: true },
  avatarPath: { type: String }
}, { timestamps: true });

const GuestModel = mongoose.model('guests', guestSchema);


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập' });
  }

  try {
    const guest = await GuestModel.findOne({ username: username.trim() });
    if (guest) {
      if (password === guest.phone) {
        const { password: _, ...guestInfo } = guest.toObject();
        return res.status(200).json({
          success: true,
          message: 'Đăng nhập khách hàng thành công',
          user: guestInfo,
          userType: 'guest'
        });
      } else {
        return res.status(401).json({ success: false, message: 'Sai mật khẩu (thực tế là sai số điện thoại)' });
      }
    }

    return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });

  } catch (err) {
    console.error("Lỗi khi đăng nhập:", err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});