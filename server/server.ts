import express, { Request, Response } from 'express';
import 'dotenv/config'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import { stripeWebhook } from './controllers/stripeWebhook.js';

const app = express();

const port = 3000;

const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];

const corsoptions = {
    origin: (incomingOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Log origin for debugging CORS issues in deployments
        console.log('[CORS] incoming origin:', incomingOrigin);
        console.log('[CORS] trusted origins:', trustedOrigins);
        // Allow non-browser or same-origin requests when no origin is provided
        if (!incomingOrigin) return callback(null, true);
        // If no trusted origins configured, allow all origins
        if (!trustedOrigins || trustedOrigins.length === 0) return callback(null, true);
        // Trim trailing slashes for comparison
        const normalizedIncomingOrigin = incomingOrigin.replace(/\/$/, '');
        const normalizedTrustedOrigins = trustedOrigins.map(origin => origin.replace(/\/$/, ''));
        if (normalizedTrustedOrigins.includes(normalizedIncomingOrigin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    maxAge: 86400
}

app.use(cors(corsoptions));

// Handle preflight OPTIONS requests for any path without registering a '*' route
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return cors(corsoptions)(req as any, res as any, () => res.sendStatus(204));
    }
    return next();
});
app.post('/api/stripe',express.raw({type:'application/json'}),stripeWebhook)

// Mount the auth handler at the base path so subpaths are handled
// by the handler without using a raw '*' pattern which newer
// path-to-regexp versions reject.
app.use('/api/auth', toNodeHandler(auth));

app.use(express.json({limit: '50mb'}));

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
// Return 204 for favicon requests to avoid unnecessary errors
app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
});
app.use('/api/user',userRouter);
app.use('/api/project',projectRouter)

export default app;