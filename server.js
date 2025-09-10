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

  // ----- BẮT ĐẦU CODE MỚI ĐỂ DEBUG -----
  // Trả về ngay lập tức username và password nhận được mà không kiểm tra database
  return res.status(200).json({
    success: true,
    message: 'Server đã nhận được dữ liệu thành công (đây là chế độ debug).',
    receivedData: {
      username: username,
      password: password
    }
  });
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});