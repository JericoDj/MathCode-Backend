// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// ── Global limiter ──────────────────────────────────────────────────────────
// Applied to every request as baseline protection.
export const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX || 100, 10),
    standardHeaders: true,   // Return rate-limit info in `RateLimit-*` headers
    legacyHeaders: false,     // Disable `X-RateLimit-*` headers
    message: {
        message: 'Too many requests, please try again later.',
    },
});

// ── Auth limiter ────────────────────────────────────────────────────────────
// Strict limiter for login / register / password-reset / OAuth endpoints.
export const authLimiter = rateLimit({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || 10, 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many authentication attempts, please try again later.',
    },
});

// ── Payment limiter ─────────────────────────────────────────────────────────
// Strict limiter for payment creation / capture endpoints.
export const paymentLimiter = rateLimit({
    windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 10),
    max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || 20, 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many payment requests, please try again later.',
    },
});
