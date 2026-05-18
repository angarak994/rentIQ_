import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const authRouter = Router();

authRouter.post('/signup', [body('email').isEmail(), body('password').isLength({ min: 6 })], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password, name, phone } = req.body;
    const user = await (await import('../services/authService')).registerUser(email, password, name, 'TENANT', phone);
    res.json({ ok: true, userId: user.id });
  } catch (err) { next(err); }
});

authRouter.post('/login', [body('email').isEmail(), body('password').exists()], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const svc = await import('../services/authService');
    const user = await svc.authenticate(email, password);
    const access = svc.signJwt({ sub: user.id });
    const refresh = await svc.createRefreshToken(user.id);
    res.json({ access, refresh });
  } catch (err) { next(err); }
});

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: 'Missing refresh token' });
    const svc = await import('../services/authService');
    const payload: any = await svc.verifyRefreshToken(refresh);
    const access = svc.signJwt({ sub: payload.sub });
    res.json({ access });
  } catch (err) { next(err); }
});

authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: 'Missing refresh token' });
    const svc = await import('../services/authService');
    await svc.revokeRefreshToken(refresh);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
