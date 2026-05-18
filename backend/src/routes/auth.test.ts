import request from 'supertest';
import { createServer } from '../server';
import prisma from '../prisma/client';

const app = createServer();

describe('Authentication API Endpoints', () => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const testEmail = `test-user-${uniqueId}@example.com`;
  const testPassword = 'securePassword123';
  const testName = 'Test User';
  const testPhone = '1234567890';

  afterAll(async () => {
    // Cascade delete generated refresh tokens then the test users
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test-user-'
          }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-user-'
        }
      }
    });

    await prisma.$disconnect();
  });

  describe('POST /auth/signup', () => {
    it('should register a new tenant successfully', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
          phone: testPhone
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('userId');
    });

    it('should reject registration if email format is invalid', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: testPassword,
          name: testName
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration if password is too short', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: `test-user-short-${uniqueId}@example.com`,
          password: '123',
          name: testName
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration if email already exists', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName
        });

      expect(response.status).toBe(500); // Server throws an error for unique constraint
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate user and return access and refresh tokens', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access');
      expect(response.body).toHaveProperty('refresh');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongPassword'
        });

      expect(response.status).toBe(500); // authService throws error which propagates to error handler
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(response.status).toBe(500);
    });
  });
});
