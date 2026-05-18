import prisma from '../prisma/client';

export async function createProperty(landlordId: string, data: { name: string; address?: string }){
  return prisma.property.create({ data: { name: data.name, address: data.address || '', landlordId } });
}

export async function listProperties(landlordId: string){
  return prisma.property.findMany({ where: { landlordId }, include: { units: { include: { leases: { include: { tenant: true } } } } } });
}

export async function updateProperty(id: string, data: { name?: string; address?: string }){
  return prisma.property.update({ where: { id }, data });
}

export async function deleteProperty(id: string){
  return prisma.property.delete({ where: { id } });
}

export async function createUnit(propertyId: string, name: string){
  return prisma.unit.create({ data: { name, propertyId } });
}

export async function updateUnit(id: string, name: string){
  return prisma.unit.update({ where: { id }, data: { name } });
}

export async function deleteUnit(id: string){
  return prisma.unit.delete({ where: { id } });
}

export async function assignTenantToUnit(unitId: string, tenantId: string, rentAmount: number, startDate: Date, endDate?: Date, cycle = 'monthly'){
  return prisma.lease.create({ data: { unitId, tenantId, rentAmount, startDate, endDate, cycle } });
}

export async function updateLease(id: string, data: any){
  return prisma.lease.update({ where: { id }, data });
}

export async function deleteLease(id: string){
  return prisma.lease.delete({ where: { id } });
}
