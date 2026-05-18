import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as rentService from '../services/rentService';

export const rentRouter = Router();

rentRouter.post('/generate-monthly', requireAuth, async (req, res, next) => {
  try{
    const invoices = await rentService.generateMonthlyInvoices();
    res.json({ count: invoices.length });
  }catch(err){ next(err); }
});

rentRouter.get('/invoices/:invoiceId', requireAuth, async (req, res, next) => {
  try{
    const id = req.params.invoiceId;
    const invoice = await (await import('../prisma/client')).default.rentInvoice.findUnique({ where: { id }, include: { payments: true } });
    res.json(invoice);
  }catch(err){ next(err); }
});

rentRouter.put('/invoices/:invoiceId', requireAuth, async (req, res, next) => {
  try{
    const invoice = await rentService.updateInvoice(req.params.invoiceId, req.body);
    res.json(invoice);
  }catch(err){ next(err); }
});

rentRouter.delete('/invoices/:invoiceId', requireAuth, async (req, res, next) => {
  try{
    await rentService.deleteInvoice(req.params.invoiceId);
    res.json({ success: true });
  }catch(err){ next(err); }
});
