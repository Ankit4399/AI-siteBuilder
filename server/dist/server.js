import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import { stripeWebhook } from './controllers/stripeWebhook.js';
const app = express();
const port = 3000;
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];
const corsoptions = {
    origin: trustedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400
};
app.use(cors(corsoptions));
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
app.options('*', cors(corsoptions));
app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json({ limit: '50mb' }));
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
export default app;
