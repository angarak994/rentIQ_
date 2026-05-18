import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { add } from 'date-fns';

export async function registerUser(email: string, password: string, name?: string, role: any = 'TENANT', phone?: string) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name, role, phone } });
  return user;
}

export function signJwt(payload: object, expiresIn = process.env.JWT_ACCESS_EXP || '15m') {
  return jwt.sign(payload as any, String(process.env.JWT_SECRET || 'secret'), { expiresIn } as jwt.SignOptions);
}

export async function createRefreshToken(userId: string) {
  const token = jwt.sign({ sub: userId }, String(process.env.JWT_SECRET || 'secret'), { expiresIn: process.env.JWT_REFRESH_EXP || '7d' } as jwt.SignOptions);
  const exp = add(new Date(), { days: 7 });
  await prisma.refreshToken.create({ data: { userId, token, expiresAt: exp } });
  return token;
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error('Invalid credentials');
  return user;
}

export async function verifyRefreshToken(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const dbToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }
    return payload;
  } catch (e) { throw new Error('Invalid refresh token'); }
}
