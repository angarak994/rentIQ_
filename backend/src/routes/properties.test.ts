import request from 'supertest';
import { createServer } from '../server';
import prisma from '../prisma/client';
import { signJwt } from '../services/authService';

const app = createServer();

describe('Properties API Endpoints', () => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const testLandlordEmail = `test-landlord-${uniqueId}@example.com`;
  const testTenantEmail = `test-tenant-${uniqueId}@example.com`;
  const testPassword = 'securePassword123';
  
  let landlordToken: string;
  let landlordId: string;
  let tenantId: string;
  let propertyId: string;
  let unitId: string;

  beforeAll(async () => {
    // Create test landlord and tenant users
    const responseLandlord = await request(app)
      .post('/auth/signup')
      .send({
        email: testLandlordEmail,
        password: testPassword,
        name: 'Test Landlord',
        phone: '1111111111'
      });
    landlordId = responseLandlord.body.userId;
    landlordToken = signJwt({ sub: landlordId });

    const responseTenant = await request(app)
      .post('/auth/signup')
      .send({
        email: testTenantEmail,
        password: testPassword,
        name: 'Test Tenant',
        phone: '2222222222'
      });
    tenantId = responseTenant.body.userId;
  });

  afterAll(async () => {
    // Correct cascade order of deletion to prevent foreign key constraint violations
    await prisma.notificationLog.deleteMany({});
    
    await prisma.payment.deleteMany({
      where: {
        invoice: {
          lease: {
            tenantId: { in: [landlordId, tenantId] }
          }
        }
      }
    });

    await prisma.rentInvoice.deleteMany({
      where: {
        lease: {
          tenantId: { in: [landlordId, tenantId] }
        }
      }
    });

    await prisma.deduction.deleteMany({
      where: {
        lease: {
          tenantId: { in: [landlordId, tenantId] }
        }
      }
    });

    await prisma.lease.deleteMany({
      where: {
        tenantId: { in: [landlordId, tenantId] }
      }
    });

    await prisma.unit.deleteMany({
      where: {
        property: {
          landlordId: landlordId
        }
      }
    });

    await prisma.expense.deleteMany({
      where: {
        property: {
          landlordId: landlordId
        }
      }
    });

    await prisma.property.deleteMany({
      where: {
        landlordId: landlordId
      }
    });

    await prisma.refreshToken.deleteMany({
      where: {
        userId: { in: [landlordId, tenantId] }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [landlordId, tenantId] }
      }
    });

    await prisma.$disconnect();
  });

  describe('GET /properties', () => {
    it('should reject requests without authorization token', async () => {
      const response = await request(app).get('/properties');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Missing authorization');
    });

    it('should reject requests with invalid authorization token', async () => {
      const response = await request(app)
        .get('/properties')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return empty list of properties for a new landlord', async () => {
      const response = await request(app)
        .get('/properties')
        .set('Authorization', `Bearer ${landlordToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /properties', () => {
    it('should create a new property for authorized landlord', async () => {
      const response = await request(app)
        .post('/properties')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          name: 'Greenwoods Villa',
          address: '123 Meadow Lane'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Greenwoods Villa');
      expect(response.body).toHaveProperty('address', '123 Meadow Lane');
      propertyId = response.body.id;
    });
  });

  describe('POST /properties/:propertyId/units', () => {
    it('should create a unit under a property', async () => {
      const response = await request(app)
        .post(`/properties/${propertyId}/units`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          name: 'Apartment A1'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Apartment A1');
      expect(response.body).toHaveProperty('propertyId', propertyId);
      unitId = response.body.id;
    });
  });

  describe('POST /properties/units/:unitId/assign', () => {
    it('should assign a tenant to a unit and create a lease', async () => {
      const response = await request(app)
        .post(`/properties/units/${unitId}/assign`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          tenantId: tenantId,
          rentAmount: 12000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          cycle: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('tenantId', tenantId);
      expect(response.body).toHaveProperty('unitId', unitId);
      expect(response.body).toHaveProperty('rentAmount', 12000);
    });
  });
});
