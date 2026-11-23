import { Response, Request } from "express";
import { db } from "../../config/db";
import { invoice, sales } from "../../config/schema";
import { and, count, countDistinct, desc, eq, gte, lt, sum } from "drizzle-orm";

// Validasi dan pengambilan periode
const getPeriod = (req: Request) => {
  const { startDate, endDate } = req.query;

  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00+07:00`);
  const end = new Date(`${endDate}T00:00:00+07:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !==
      new Date(`${startDate}T00:00:00+07:00`).toISOString().slice(0, 10) ||
    start > end
  ) {
    return null;
  }

  // Batas akhir eksklusif
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};

export class Statistic {
  // 1. Statistik penjualan
  seller = async (req: Request, res: Response) => {
    try {
      const period = getPeriod(req);

      if (!period) {
        return res.status(400).json({
          success: false,
          message: "Periode tanggal tidak valid",
        });
      }

      const [data] = await db
        .select({
          totalTransactions: countDistinct(sales.id),
          totalItemsSold: sum(invoice.quantity).mapWith(Number),
        })
        .from(sales)
        .leftJoin(invoice, eq(invoice.saleId, sales.id))
        .where(
          and(
            eq(sales.status, "selesai"),
            gte(sales.createdAt, period.start),
            lt(sales.createdAt, period.end),
          ),
        );

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil statistik penjualan",
        data: {
          totalTransactions: Number(data.totalTransactions),
          totalItemsSold: data.totalItemsSold ?? 0,
        },
      });
    } catch (error) {
      console.error("Statistic seller:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // 2. Produk paling laku
  popularProduct = async (req: Request, res: Response) => {
    try {
      const period = getPeriod(req);

      if (!period) {
        return res.status(400).json({
          success: false,
          message: "Periode tanggal tidak valid",
        });
      }

      const data = await db
        .select({
          productId: invoice.productId,
          productName: invoice.productName,
          totalSold: sum(invoice.quantity).mapWith(Number),
          totalRevenue: sum(invoice.subtotal).mapWith(Number),
        })
        .from(invoice)
        .innerJoin(sales, eq(invoice.saleId, sales.id))
        .where(
          and(
            eq(sales.status, "selesai"),
            gte(sales.createdAt, period.start),
            lt(sales.createdAt, period.end),
          ),
        )
        .groupBy(invoice.productId, invoice.productName)
        .orderBy(desc(sum(invoice.quantity)))
        .limit(10);

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil produk terlaris",
        data,
      });
    } catch (error) {
      console.error("Statistic popular product:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // 3. Total pendapatan
  income = async (req: Request, res: Response) => {
    try {
      const period = getPeriod(req);

      if (!period) {
        return res.status(400).json({
          success: false,
          message: "Periode tanggal tidak valid",
        });
      }

      const [data] = await db
        .select({
          totalIncome: sum(sales.total).mapWith(Number),
          totalTransactions: count(sales.id),
        })
        .from(sales)
        .where(
          and(
            eq(sales.status, "selesai"),
            gte(sales.createdAt, period.start),
            lt(sales.createdAt, period.end),
          ),
        );

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil total pendapatan",
        data: {
          totalIncome: data.totalIncome ?? 0,
          totalTransactions: Number(data.totalTransactions),
        },
      });
    } catch (error) {
      console.error("Statistic income:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}

export default new Statistic();
