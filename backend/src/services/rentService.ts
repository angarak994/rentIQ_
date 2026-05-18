import prisma from '../prisma/client';

export function calculateLateFee(invoiceAmount: number, daysOverdue: number) {
  // simple rule: 1% per day up to 30 days, else flat 50%
  if (daysOverdue <= 0) return 0;
  if (daysOverdue > 30) return invoiceAmount * 0.5;
  return invoiceAmount * 0.01 * daysOverdue;
}

export async function generateInvoiceForLease(leaseId: string, forDate: Date) {
  const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
  if (!lease) throw new Error('Lease not found');
  const dueDate = new Date(forDate);
  dueDate.setDate(1); // due date -> first of month (example)
  const invoice = await prisma.rentInvoice.create({ data: { leaseId, amount: lease.rentAmount, dueDate, paid: false } });
  return invoice;
}

export async function generateMonthlyInvoices() {
  // find active leases and generate invoices for next cycle
  const leases = await prisma.lease.findMany();
  const promises = leases.map((l: any) => generateInvoiceForLease(l.id, new Date()));
  return Promise.all(promises);
}

export async function updateInvoice(id: string, data: any) {
  return prisma.rentInvoice.update({ where: { id }, data });
}

export async function deleteInvoice(id: string) {
  return prisma.rentInvoice.delete({ where: { id } });
}
