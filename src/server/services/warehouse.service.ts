import mongoose from 'mongoose';
import { Warehouse, type IWarehouse, type WarehouseType } from '../models/Warehouse.js';
import { WarehouseZone, type IWarehouseZone, type ZoneType } from '../models/WarehouseZone.js';
import { WarehouseLocation, type IWarehouseLocation } from '../models/WarehouseLocation.js';
import { InventoryLocation } from '../models/InventoryLocation.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { memoryCache } from '../utils/cache.js';

export interface CreateWarehouseInput {
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  warehouseType?: WarehouseType;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  managerId?: string;
  timezone?: string;
  capacityUnits?: number;
  capacityWeight?: number;
  capacityVolume?: number;
  notes?: string;
}

export interface CreateZoneInput {
  companyId: string;
  warehouseId: string;
  name: string;
  code: string;
  zoneType?: ZoneType;
  description?: string;
  temperatureMin?: number;
  temperatureMax?: number;
  capacityUnits?: number;
  createdBy: string;
}

export interface CreateLocationInput {
  companyId: string;
  warehouseId: string;
  zoneId: string;
  locationCode: string;
  label?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  locationType?:
    | 'RECEIVING'
    | 'STORAGE'
    | 'PICKING'
    | 'PACKING'
    | 'QUARANTINE'
    | 'DAMAGED'
    | 'RETURNS'
    | 'DISPATCH'
    | 'TRANSIT';
  capacityUnits?: number;
  capacityWeight?: number;
  capacityVolume?: number;
  allowedProductIds?: string[];
  notes?: string;
  createdBy: string;
}

export class WarehouseService {
  /**
   * Create a new Warehouse
   */
  async createWarehouse(input: CreateWarehouseInput): Promise<IWarehouse> {
    const existing = await Warehouse.findOne({ code: input.code.toUpperCase() });
    if (existing) {
      throw new ValidationError(`Warehouse code [${input.code}] already exists.`);
    }

    const warehouse = await Warehouse.create({
      ...input,
      code: input.code.toUpperCase(),
      isActive: true,
    });

    memoryCache.invalidatePrefix('warehouses');
    return warehouse;
  }

  /**
   * Get all warehouses for a company/branch
   */
  async getWarehouses(companyId: string, branchId?: string): Promise<IWarehouse[]> {
    const cacheKey = `warehouses:${companyId}:${branchId || 'all'}`;
    const cached = memoryCache.get<IWarehouse[]>(cacheKey);
    if (cached) return cached;

    const query: any = { companyId, isActive: true };
    if (branchId) query.branchId = branchId;

    const warehouses = await Warehouse.find(query).sort({ name: 1 }).lean();
    memoryCache.set(cacheKey, warehouses, 15000);
    return warehouses as unknown as IWarehouse[];
  }

  /**
   * Get single warehouse by ID
   */
  async getWarehouseById(warehouseId: string): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) throw new NotFoundError('Warehouse not found');
    return warehouse;
  }

  /**
   * Create a Warehouse Zone
   */
  async createZone(input: CreateZoneInput): Promise<IWarehouseZone> {
    const warehouse = await Warehouse.findById(input.warehouseId);
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const existing = await WarehouseZone.findOne({
      warehouseId: input.warehouseId,
      code: input.code.toUpperCase(),
    });
    if (existing) {
      throw new ValidationError(`Zone code [${input.code}] already exists in this warehouse.`);
    }

    const zone = await WarehouseZone.create({
      ...input,
      code: input.code.toUpperCase(),
    });

    memoryCache.invalidatePrefix(`zones:${input.warehouseId}`);
    return zone;
  }

  /**
   * Get zones in a warehouse
   */
  async getZones(warehouseId: string): Promise<IWarehouseZone[]> {
    const cacheKey = `zones:${warehouseId}`;
    const cached = memoryCache.get<IWarehouseZone[]>(cacheKey);
    if (cached) return cached;

    const zones = await WarehouseZone.find({ warehouseId, isActive: true })
      .sort({ code: 1 })
      .lean();
    memoryCache.set(cacheKey, zones, 15000);
    return zones as unknown as IWarehouseZone[];
  }

  /**
   * Create a Storage Location (Bin/Rack/Shelf)
   */
  async createLocation(input: CreateLocationInput): Promise<IWarehouseLocation> {
    const zone = await WarehouseZone.findById(input.zoneId);
    if (!zone) throw new NotFoundError('Zone not found');

    const locationCodeUpper = input.locationCode.toUpperCase();
    const existing = await WarehouseLocation.findOne({
      warehouseId: input.warehouseId,
      locationCode: locationCodeUpper,
    });
    if (existing) {
      throw new ValidationError(
        `Location code [${locationCodeUpper}] already exists in this warehouse.`
      );
    }

    const location = await WarehouseLocation.create({
      ...input,
      locationCode: locationCodeUpper,
      locationType: input.locationType || zone.zoneType,
      currentUnits: 0,
      currentWeight: 0,
      currentVolume: 0,
    });

    memoryCache.invalidatePrefix(`locations:${input.warehouseId}`);
    return location;
  }

  /**
   * Get locations in a warehouse (with optional zone / type filter)
   */
  async getLocations(
    warehouseId: string,
    filters?: { zoneId?: string; locationType?: string; aisle?: string; search?: string }
  ): Promise<IWarehouseLocation[]> {
    const query: any = { warehouseId, isActive: true };
    if (filters?.zoneId) query.zoneId = filters.zoneId;
    if (filters?.locationType) query.locationType = filters.locationType;
    if (filters?.aisle) query.aisle = filters.aisle;
    if (filters?.search) {
      query.$or = [
        { locationCode: new RegExp(filters.search, 'i') },
        { label: new RegExp(filters.search, 'i') },
      ];
    }

    return WarehouseLocation.find(query)
      .sort({ locationCode: 1 })
      .lean() as unknown as IWarehouseLocation[];
  }

  /**
   * Calculate warehouse capacity utilization analytics
   */
  async getCapacityAnalytics(warehouseId: string) {
    const warehouse = await this.getWarehouseById(warehouseId);
    const locations = await WarehouseLocation.find({ warehouseId, isActive: true });

    let totalCapacityUnits = 0;
    let totalUsedUnits = 0;
    let totalCapacityWeight = 0;
    let totalUsedWeight = 0;

    for (const loc of locations) {
      totalCapacityUnits += loc.capacityUnits || 0;
      totalUsedUnits += loc.currentUnits || 0;
      totalCapacityWeight += loc.capacityWeight || 0;
      totalUsedWeight += loc.currentWeight || 0;
    }

    const utilizationPercentage =
      totalCapacityUnits > 0
        ? Math.round((totalUsedUnits / totalCapacityUnits) * 100)
        : warehouse.capacityUnits && warehouse.capacityUnits > 0
          ? Math.round((totalUsedUnits / warehouse.capacityUnits) * 100)
          : 0;

    return {
      warehouseId,
      warehouseName: warehouse.name,
      totalLocations: locations.length,
      capacityUnits: totalCapacityUnits || warehouse.capacityUnits || 0,
      usedUnits: totalUsedUnits,
      availableUnits: Math.max(
        0,
        (totalCapacityUnits || warehouse.capacityUnits || 0) - totalUsedUnits
      ),
      utilizationPercentage,
      capacityWeightKg: totalCapacityWeight,
      usedWeightKg: totalUsedWeight,
    };
  }
}

export const warehouseService = new WarehouseService();
