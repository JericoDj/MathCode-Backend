  // app.js
  import express from 'express';
  import mongoose from 'mongoose';
  import cors from 'cors';
  import dotenv from 'dotenv';
  dotenv.config();
  import userRoutes from './routes/userRoutes.js';
  import { notFound, errorHandler } from './middleware/errorMiddleware.js';

  import packageRoutes from './routes/packageRoutes.js';
  import courseRoutes from './routes/courseRoutes.js';
  import classGroupRoutes from './routes/classGroupRoutes.js';
  import sessionRoutes from './routes/sessionRoutes.js';
  import studentRoutes from './routes/studentRoutes.js';
  import enrollmentRoutes from './routes/enrollmentRoutes.js';
  import attendanceRoutes from './routes/attendanceRoutes.js';
  import invoiceRoutes from './routes/invoiceRoutes.js';
  import paymentRoutes from './routes/paymentRoutes.js';

  import billingRoutes from "./routes/billingRoutes.js";
  import session from 'express-session'; 



  const app = express();
  const PORT = process.env.PORT || 4000;

  console.log("PAYPAL ENV TEST:", {
    CLIENT: process.env.PAYPAL_CLIENT_ID_SANDBOX,
    SECRET: process.env.PAYPAL_SECRET_SANDBOX ? "exists" : "missing"
  });

// CORS first (must run before session)
const corsOptions = {
  origin: [
    "https://math-code-web.vercel.app",
    "https://math-code-admin.vercel.app",
    "https://math-code-web.netlify.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:5000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // allow preflight


// Session middleware (after CORS)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "SECRETGOOGLESESSION",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // required on Vercel
      httpOnly: true,
      sameSite: "none", // REQUIRED for cross-origin
      maxAge: 15 * 60 * 1000,
    },
  })
);

// JSON body parser (after session)
app.use(express.json());



  // MongoDB connection
  await mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    bufferCommands: false,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB Error:', err));
  // Routes
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Welcome to MathCode API',
      status: 'Online',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/users', userRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/packages', packageRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/class-groups', classGroupRoutes);
  app.use('/api/enrollments', enrollmentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use("/api/billing", billingRoutes);

  // Error handlers
  app.use(notFound);
  app.use(errorHandler);

  // Export the app for Vercel serverless functions
  export default app;

  // Only start server if not in Vercel environment
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }