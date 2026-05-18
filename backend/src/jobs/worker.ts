import { Worker } from 'bullmq';
import connection from './queues';
import prisma from '../prisma/client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const worker = new Worker('reminders', async job => {
  const data = job.data;
  
  if (job.name === 'automated-rent-calculation') {
    const { tenantName, phone, propertyName, unitName, rentAmount, waterCharge, totalAmount } = data;
    
    // Construct message in English and Marathi
    const messageEn = `Hello ${tenantName},\nYour rent calculation for ${propertyName} - ${unitName} is ready.\n\nMonthly Rent: ${formatCurrency(rentAmount)}\nWater Charge: ${formatCurrency(waterCharge)}\nTotal Amount Due: ${formatCurrency(totalAmount)}\n\nKindly arrange the payment at your earliest convenience. If the payment has already been completed, please disregard this message.\nThank you.`;
    
    const messageMr = `नमस्कार ${tenantName},\nआपल्या ${propertyName} - ${unitName} चे भाडे बिल तयार आहे.\n\nमासिक भाडे: ${formatCurrency(rentAmount)}\nपाणी शुल्क: ${formatCurrency(waterCharge)}\nएकूण थकबाकी रक्कम: ${formatCurrency(totalAmount)}\n\nकृपया लवकरात लवकर पेमेंटची व्यवस्था करावी. जर पेमेंट आधीच पूर्ण झाले असेल, तर कृपया या संदेशाकडे दुर्लक्ष करावे.\nधन्यवाद.`;
    
    const fullMessage = `${messageEn}\n\n==============================\n\n${messageMr}`;
    
    // eslint-disable-next-line no-console
    console.log('\n\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════');
    // eslint-disable-next-line no-console
    console.log('\x1b[33m%s\x1b[0m', ' [AUTOMATED RENT CALCULATION SENT]');
    // eslint-disable-next-line no-console
    console.log('\x1b[32m%s\x1b[0m', ` Phone: ${phone}`);
    // eslint-disable-next-line no-console
    console.log('════════════════════════════════════════════════════════════');
    // eslint-disable-next-line no-console
    console.log(fullMessage);
    // eslint-disable-next-line no-console
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════\n');

    await prisma.notificationLog.create({
      data: {
        userId: data.userId,
        type: 'calculation',
        status: 'SENT',
        payload: {
          phone,
          messageEn,
          messageMr,
          fullMessage,
          rentAmount,
          waterCharge,
          totalAmount
        }
      }
    });

  } else if (job.name === 'automated-payment-reminder') {
    const { tenantName, phone, propertyName, unitName, totalAmount } = data;

    const messageEn = `Hello ${tenantName},\nThis is a gentle reminder regarding your pending rent payment of ${formatCurrency(totalAmount)} for ${propertyName} - ${unitName}.\n\nKindly arrange the payment at your earliest convenience.\nThank you.`;

    const messageMr = `नमस्कार ${tenantName},\nआपल्या ${propertyName} - ${unitName} च्या ${formatCurrency(totalAmount)} भाड्याच्या पेमेंटसाठी ही एक नम्र आठवण आहे.\n\nकृपया लवकरात लवकर पेमेंटची व्यवस्था करावी.\nधन्यवाद.`;

    const fullMessage = `${messageEn}\n\n==============================\n\n${messageMr}`;

    // eslint-disable-next-line no-console
    console.log('\n\x1b[35m%s\x1b[0m', '════════════════════════════════════════════════════════════');
    // eslint-disable-next-line no-console
    console.log('\x1b[31m%s\x1b[0m', ' [AUTOMATED PAYMENT REMINDER SENT (2-MIN)]');
    // eslint-disable-next-line no-console
    console.log('\x1b[32m%s\x1b[0m', ` Phone: ${phone}`);
    // eslint-disable-next-line no-console
    console.log('════════════════════════════════════════════════════════════');
    // eslint-disable-next-line no-console
    console.log(fullMessage);
    // eslint-disable-next-line no-console
    console.log('\x1b[35m%s\x1b[0m', '════════════════════════════════════════════════════════════\n');

    await prisma.notificationLog.create({
      data: {
        userId: data.userId,
        type: 'reminder_2min',
        status: 'SENT',
        payload: {
          phone,
          messageEn,
          messageMr,
          fullMessage,
          totalAmount
        }
      }
    });

  } else {
    // Default fallback mock reminder creation
    await prisma.notificationLog.create({
      data: {
        userId: data.userId,
        type: data.type || 'reminder',
        payload: data,
        status: 'SENT'
      }
    });
  }
}, { connection });

worker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error('Job failed', job?.id, err);
});

export default worker;
