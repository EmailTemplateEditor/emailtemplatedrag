const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cors()); // Enable CORS for cross-origin requests

// Set up MongoDB connection
mongoose.connect('mongodb://localhost:27017/uploadcard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Define a Content Schema
const contentSchema = new mongoose.Schema({
    type: String, // 'heading', 'text', or 'image'
    text: String, // For 'heading' or 'text'
    src: String, // For 'image'
    style: { // Store styles, including background color
        fontSize: String,
        color: String,
        textAlign: String,
        backgroundColor: String, // Only background color
    },
});
//hello
//world
// Create Content Model
const Content = mongoose.model('Content', contentSchema);
// Cloudinary Configuration
cloudinary.config({
    cloud_name: "dycpqrh2n", // Replace with your Cloudinary cloud name
    api_key: "887442727788494", // Replace with your Cloudinary API key
    api_secret: "iJ_zEPVps-knWZEDsMksgQSrfkA", // Replace with your Cloudinary API secret
})
// Multer-Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

// Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({ url: req.file.path });
  } else {
    res.status(400).json({ error: 'Failed to upload image' });
  }
});

// Save Endpoint (placeholder)
app.post('/save', async(req, res) => {
  const { content } = req.body;
  console.log('Saving content:', content);
  const savedContent= await Content.insertMany(content);
  res.status(200).json({ message: 'Content saved successfully!',savedContent});
});

// // Email Endpoint (placeholder)
// app.post('/send-email', (req, res) => {
//   const { content } = req.body;
//   console.log('Sending email with content:', content);
//   res.status(200).json({ message: 'Email sent successfully!' });
// });

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or another email service like SendGrid, Mailgun, etc.
    auth: {
        user: "megarajan55@gmail.com", // Replace with your email
        pass: "jrwg fhjo guri toat" // Replace with your email password or app-specific password
    }
});

app.post('/send-email', async (req, res) => {
  const { content } = req.body;

  // Use the first item's backgroundColor for the email's background
  const backgroundColor = content[0]?.style?.backgroundColor || 'white';

  // Start email content with the background color
  let emailContent = `
    <div style="font-family: Arial, sans-serif; background-color: ${backgroundColor};width:600px;height:auto;margin:0 auto;">
  `;

  content.forEach(item => {
    if (item.type === 'heading') {
      emailContent += `
        <h1 style="font-size: ${item.style.fontSize}; color: ${item.style.color}; text-align: ${item.style.textAlign};">
          ${item.text}
        </h1>`;
    } else if (item.type === 'text') {
      emailContent += `
        <p style="font-size: ${item.style.fontSize}; color: ${item.style.color}; text-align: ${item.style.textAlign};">
          ${item.text}
        </p>`;
    } else if (item.type === 'image' && item.src) {
      emailContent += `
        <img src="${item.src}" style="width: ${item.style.width}; height: ${item.style.height}; text-align: ${item.style.textAlign};" alt="Uploaded Image" />
      `;
    }
  });

  emailContent += '</div>';

  // Send email using Nodemailer
  const mailOptions = {
    from: 'megarajan55@gmail.com',
    to: "renugajagadeesan@gmail.com,megarajan55@gmail.com",
    subject: 'Preview Content',
    html: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});



// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
