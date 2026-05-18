import prisma from '../prisma/client';
import { reminderQueue } from './queues';

export async function scheduleRentReminder(userId: string, when: Date, payload: any){
  await reminderQueue.add('rent-reminder', payload, { delay: Math.max(0, when.getTime() - Date.now()), attempts: 3 });
}

export async function scheduleReminderSequence(userId: string, dueDate: Date, invoiceId: string){
  // schedule T-7, T-3, T-1 reminders
  const times = [7,3,1];
  for(const t of times){
    const when = new Date(dueDate);
    when.setDate(dueDate.getDate() - t);
    await scheduleRentReminder(userId, when, { userId, invoiceId, when: when.toISOString(), type: 'due' });
  }
  // overdue reminder at dueDate + 1
  const overdue = new Date(dueDate);
  overdue.setDate(dueDate.getDate() + 1);
  await scheduleRentReminder(userId, overdue, { userId, invoiceId, when: overdue.toISOString(), type: 'overdue' });
}

export async function scheduleAutomatedCalculationAndReminder(leaseId: string) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: true,
      unit: {
        include: {
          property: true
        }
      }
    }
  });
  if (!lease) throw new Error('Lease not found');

  const rentAmount = lease.rentAmount;
  const waterCharge = 55;
  const totalAmount = rentAmount + waterCharge;
  const tenantName = lease.tenant.name || 'Tenant';
  const tenantPhone = lease.tenant.phone || '';
  const propertyName = lease.unit.property.name;
  const unitName = lease.unit.name;

  const startDate = new Date(lease.startDate);
  const now = new Date();

  // Delay for calculation message: sent on the date they first started living
  const calcDelay = Math.max(0, startDate.getTime() - now.getTime());

  // Delay for payment reminder: exactly 2 minutes (120000ms) after the calculation
  const reminderDelay = calcDelay + 120000;

  // 1. Add automated rent calculation job
  await reminderQueue.add('automated-rent-calculation', {
    leaseId: lease.id,
    userId: lease.tenantId,
    tenantName,
    phone: tenantPhone,
    propertyName,
    unitName,
    rentAmount,
    waterCharge,
    totalAmount,
    type: 'calculation'
  }, { delay: calcDelay, attempts: 3 });

  // 2. Add automated payment reminder job 2 minutes later
  await reminderQueue.add('automated-payment-reminder', {
    leaseId: lease.id,
    userId: lease.tenantId,
    tenantName,
    phone: tenantPhone,
    propertyName,
    unitName,
    totalAmount,
    type: 'reminder_2min'
  }, { delay: reminderDelay, attempts: 3 });
}
