// app.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';


import packageRoutes from './routes/packageRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import classGroupRoutes from './routes/classGroupRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import requestSessionRoutes from "./routes/requestSessionRoutes.js"
import { all } from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: [

    'https://math-code-web.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());




// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI,)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to MathCode API');
});
app.use('/api/users', userRoutes);

app.use('/api/request-sessions', requestSessionRoutes);
app.use('/api/sessions', sessionRoutes);

app.use('/api/packages', packageRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/class-groups', classGroupRoutes);

app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);


// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
