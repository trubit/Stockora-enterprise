import mongoose from 'mongoose';
import { InventoryForecast, ForecastMethod, ForecastPeriod } from '../models/InventoryForecast.js';
import { Transaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';
import { logger } from '../logger.js';

export interface ForecastRequestOptions {
  productId: string;
  tenantId?: string;
  companyId?: string;
  branchId?: string;
  warehouseId?: string;
  period?: ForecastPeriod;
  method?: ForecastMethod;
  historicalDays?: number;
}

export class ForecastingService {
  /**
   * Generates or fetches a demand forecast for a given product
   */
  public static async generateProductForecast(options: ForecastRequestOptions) {
    return await ResilientExecutor.execute({ name: `forecast:${options.productId}` }, async () => {
      const {
        productId,
        tenantId = 'default',
        companyId = 'default',
        period = 'MONTHLY',
        method = 'WEIGHTED_MOVING_AVERAGE',
        historicalDays = 90,
      } = options;

      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Fetch sales transaction history for historicalDays
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - historicalDays);

      const salesAgg = await Transaction.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
            createdAt: { $gte: startDate },
            type: { $in: ['SALE', 'POS_SALE', 'OUTFLOW'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            dailyQuantity: { $sum: '$quantity' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const dailyQuantities = salesAgg.map((item) => item.dailyQuantity);
      const actualTotalDemand = dailyQuantities.reduce((a, b) => a + b, 0);

      // Perform forecasting based on selected statistical strategy
      let projectedDailyDemand = 0;
      if (dailyQuantities.length === 0) {
        projectedDailyDemand = Math.max(1, Math.round(product.quantity / 30));
      } else if (method === 'MOVING_AVERAGE') {
        projectedDailyDemand = dailyQuantities.reduce((a, b) => a + b, 0) / dailyQuantities.length;
      } else if (method === 'WEIGHTED_MOVING_AVERAGE') {
        // Give higher weight to recent days
        let weightedSum = 0;
        let weightTotal = 0;
        dailyQuantities.forEach((qty, idx) => {
          const weight = idx + 1;
          weightedSum += qty * weight;
          weightTotal += weight;
        });
        projectedDailyDemand = weightTotal > 0 ? weightedSum / weightTotal : 0;
      } else if (method === 'EXPONENTIAL_SMOOTHING') {
        const alpha = 0.3;
        let forecast = dailyQuantities[0] || 0;
        for (let i = 1; i < dailyQuantities.length; i++) {
          forecast = alpha * dailyQuantities[i] + (1 - alpha) * forecast;
        }
        projectedDailyDemand = forecast;
      } else {
        // Default: Trend & Seasonal weighted combination
        const avg = dailyQuantities.reduce((a, b) => a + b, 0) / (dailyQuantities.length || 1);
        projectedDailyDemand = avg * 1.15; // 15% seasonal/growth uplift
      }

      const daysInPeriod =
        period === 'DAILY' ? 1 : period === 'WEEKLY' ? 7 : period === 'QUARTERLY' ? 90 : 30;
      const forecastedDemand = Math.ceil(projectedDailyDemand * daysInPeriod);

      // Calculate historical error metrics (MAE, MAPE, bias)
      let mae = 0;
      let mape = 0;
      let bias = 0;
      if (dailyQuantities.length > 0) {
        const errors = dailyQuantities.map((actual) => actual - projectedDailyDemand);
        mae = errors.reduce((acc, err) => acc + Math.abs(err), 0) / dailyQuantities.length;
        bias = errors.reduce((acc, err) => acc + err, 0) / dailyQuantities.length;
        const nonZeroCount = dailyQuantities.filter((q) => q > 0).length || 1;
        mape =
          (dailyQuantities.reduce(
            (acc, actual) =>
              acc + (actual > 0 ? Math.abs((actual - projectedDailyDemand) / actual) : 0),
            0
          ) /
            nonZeroCount) *
          100;
      }

      const confidenceScore = Math.max(
        60,
        Math.min(98, Math.round(100 - (mape > 100 ? 40 : mape * 0.4)))
      );

      const forecastPeriodStart = new Date();
      const forecastPeriodEnd = new Date();
      forecastPeriodEnd.setDate(forecastPeriodEnd.getDate() + daysInPeriod);

      const forecastDoc = await InventoryForecast.create({
        tenantId,
        companyId,
        branchId: options.branchId ? new mongoose.Types.ObjectId(options.branchId) : undefined,
        warehouseId: options.warehouseId
          ? new mongoose.Types.ObjectId(options.warehouseId)
          : undefined,
        productId: product._id,
        productSku: product.sku,
        productName: product.name,
        period,
        forecastPeriodStart,
        forecastPeriodEnd,
        forecastedDemand,
        confidenceScore,
        historicalAccuracy: {
          mae: Number(mae.toFixed(2)),
          mape: Number(mape.toFixed(2)),
          bias: Number(bias.toFixed(2)),
          sampleSize: dailyQuantities.length,
        },
        method,
        parameters: { historicalDays, actualTotalDemand },
      });

      logger.info(
        `[Forecasting Service] Forecast generated for product ${product.sku}: ${forecastedDemand} units (${method})`
      );
      return forecastDoc;
    });
  }

  /**
   * Retrieves existing forecasts for a product
   */
  public static async getForecasts(productId?: string, limit = 20) {
    const query = productId ? { productId: new mongoose.Types.ObjectId(productId) } : {};
    return await InventoryForecast.find(query).sort({ createdAt: -1 }).limit(limit);
  }
}
