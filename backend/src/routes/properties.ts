import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as propertyService from '../services/propertyService';
import { scheduleAutomatedCalculationAndReminder } from '../jobs/reminderJob';

export const propertiesRouter = Router();

propertiesRouter.post('/', requireAuth, async (req, res, next) => {
  try{
    const user = (req as any).user;
    const { name, address } = req.body;
    const prop = await propertyService.createProperty(user.sub || user.id, { name, address });
    res.json(prop);
  }catch(err){ next(err); }
});

propertiesRouter.get('/', requireAuth, async (req, res, next) => {
  try{
    const user = (req as any).user;
    const list = await propertyService.listProperties(user.sub || user.id);
    res.json(list);
  }catch(err){ next(err); }
});

propertiesRouter.put('/:propertyId', requireAuth, async (req, res, next) => {
  try{
    const prop = await propertyService.updateProperty(req.params.propertyId, req.body);
    res.json(prop);
  }catch(err){ next(err); }
});

propertiesRouter.delete('/:propertyId', requireAuth, async (req, res, next) => {
  try{
    await propertyService.deleteProperty(req.params.propertyId);
    res.json({ success: true });
  }catch(err){ next(err); }
});

propertiesRouter.post('/:propertyId/units', requireAuth, async (req, res, next) => {
  try{
    const { propertyId } = req.params;
    const { name } = req.body;
    const unit = await propertyService.createUnit(propertyId, name);
    res.json(unit);
  }catch(err){ next(err); }
});

propertiesRouter.put('/units/:unitId', requireAuth, async (req, res, next) => {
  try{
    const unit = await propertyService.updateUnit(req.params.unitId, req.body.name);
    res.json(unit);
  }catch(err){ next(err); }
});

propertiesRouter.delete('/units/:unitId', requireAuth, async (req, res, next) => {
  try{
    await propertyService.deleteUnit(req.params.unitId);
    res.json({ success: true });
  }catch(err){ next(err); }
});

propertiesRouter.post('/units/:unitId/assign', requireAuth, async (req, res, next) => {
  try{
    const { unitId } = req.params;
    const { tenantId, rentAmount, startDate, endDate, cycle } = req.body;
    const lease = await propertyService.assignTenantToUnit(unitId, tenantId, rentAmount, new Date(startDate), endDate ? new Date(endDate) : undefined, cycle);
    await scheduleAutomatedCalculationAndReminder(lease.id);
    res.json(lease);
  }catch(err){ next(err); }
});

propertiesRouter.put('/leases/:leaseId', requireAuth, async (req, res, next) => {
  try{
    const lease = await propertyService.updateLease(req.params.leaseId, req.body);
    res.json(lease);
  }catch(err){ next(err); }
});

propertiesRouter.delete('/leases/:leaseId', requireAuth, async (req, res, next) => {
  try{
    await propertyService.deleteLease(req.params.leaseId);
    res.json({ success: true });
  }catch(err){ next(err); }
});
