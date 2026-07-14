import type { Request, Response, NextFunction } from 'express';
import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import { Warehouse } from '../models/Warehouse.js';
import { MasterData } from '../models/MasterData.js';
import { AuditLog } from '../models/AuditLog.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class OrgController {
  // --- Company ---
  public static async getCompany(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await Company.findOne();
      res.json(company || null);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async createCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, currency, timeZone } = req.body;
    if (!name) {
      return next(new ValidationError('Company name is required.'));
    }

    try {
      const existing = await Company.findOne();
      if (existing) {
        return next(new ValidationError('Company profile already exists.'));
      }

      const company = await Company.create({ name, currency, timeZone });
      
      await AuditLog.create({
        userId: req.user?.id,
        action: 'CREATE',
        targetModel: 'Company',
        targetId: company._id.toString(),
        newValues: company.toObject(),
      });

      res.status(201).json(company);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async updateCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await Company.findOne();
      if (!company) {
        return next(new NotFoundError('Company not found.'));
      }

      const prevObj = company.toObject();
      Object.assign(company, req.body);
      await company.save();

      await AuditLog.create({
        userId: req.user?.id,
        action: 'UPDATE',
        targetModel: 'Company',
        targetId: company._id.toString(),
        previousValues: prevObj,
        newValues: company.toObject(),
      });

      res.json(company);
    } catch (err: unknown) {
      next(err);
    }
  }

  // --- Branch ---
  public static async listBranches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branches = await Branch.find();
      res.json(branches);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async createBranch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { companyId, name, code, address, phone } = req.body;
    if (!companyId || !name || !code) {
      return next(new ValidationError('Company ID, name, and code are required.'));
    }

    try {
      const branch = await Branch.create({ companyId, name, code, address, phone });
      
      await AuditLog.create({
        userId: req.user?.id,
        action: 'CREATE',
        targetModel: 'Branch',
        targetId: branch._id.toString(),
        newValues: branch.toObject(),
      });

      res.status(201).json(branch);
    } catch (err: unknown) {
      next(err);
    }
  }

  // --- Warehouse ---
  public static async listWarehouses(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await Warehouse.find();
      res.json(warehouses);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async createWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { branchId, name, code, zones, capacity } = req.body;
    if (!branchId || !name || !code) {
      return next(new ValidationError('Branch ID, name, and code are required.'));
    }

    try {
      const warehouse = await Warehouse.create({ branchId, name, code, zones, capacity });

      await AuditLog.create({
        userId: req.user?.id,
        action: 'CREATE',
        targetModel: 'Warehouse',
        targetId: warehouse._id.toString(),
        newValues: warehouse.toObject(),
      });

      res.status(201).json(warehouse);
    } catch (err: unknown) {
      next(err);
    }
  }

  // --- Master Data ---
  public static async listMasterData(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { type } = req.query;
    const filter = type ? { type: String(type).toUpperCase() } : {};
    try {
      const masterList = await MasterData.find(filter);
      res.json(masterList);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async createMasterData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { type, name, code, value } = req.body;
    if (!type || !name || !code) {
      return next(new ValidationError('Type, name, and code are required.'));
    }

    try {
      const data = await MasterData.create({ type: type.toUpperCase(), name, code, value });

      await AuditLog.create({
        userId: req.user?.id,
        action: 'CREATE',
        targetModel: 'MasterData',
        targetId: data._id.toString(),
        newValues: data.toObject(),
      });

      res.status(201).json(data);
    } catch (err: unknown) {
      next(err);
    }
  }
}
