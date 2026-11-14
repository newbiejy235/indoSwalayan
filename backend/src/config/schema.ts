import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  pgEnum,
  varchar,
  timestamp,
  text,
  uuid,
  numeric,
  boolean,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["pemilik", "kasir"]);

export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 30 }).notNull(),
  email: varchar({ length: 30 }).notNull().unique(),
  password: varchar({ length: 50 }).notNull(),
  phone_number: varchar({ length: 15 }),
  role: role().notNull().default("pemilik"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const karyawan = pgTable("karyawan", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code : varchar({length : 30}).notNull(),
  first_name: varchar({ length: 30 }).notNull(),
  last_name: varchar({ length: 30 }).notNull(),
  email: varchar({ length: 30 }).notNull().unique(),
  password: varchar({ length: 50 }).notNull(),
  phone_number: varchar({ length: 15 }),
  role: role().notNull().default("kasir"),
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    name: varchar("name", { length: 150 }).notNull(),

    description: text("description"),

    sku: varchar("sku", { length: 100 }),

    barcode: varchar("barcode", { length: 100 }),

    price: numeric("price", {
      precision: 14,
      scale: 2,
    }).notNull(),

    stock: integer("stock").default(0).notNull(),

    imageUrl: text("image_url"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("products_barcode_unique")
      .on(table.barcode)
      .where(sql`${table.barcode} IS NOT NULL`),

    uniqueIndex("products_sku_unique")
      .on(table.sku)
      .where(sql`${table.sku} IS NOT NULL`),

    index("products_name_idx").on(table.name),

    check("products_stock_nonnegative", sql`${table.stock} >= 0`),

    check("products_price_nonnegative", sql`${table.price} >= 0`),
  ],
);

export const paymentMethodEnum = pgEnum("payment_method_enum", [
  "tunai",
  "non tunai",
]);
export const saleStatusEnum = pgEnum("sales_status", [
  "selesai",
  "menunggu",
  "belum dibayar",
]);

export const sales = pgTable(
  "sales",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    cashierId: integer("cashier_id")
      .notNull()
      .references(() => karyawan.id, {
        onDelete: "restrict",
      }),

    invoiceNumber: varchar("invoice_number", {
      length: 50,
    })
      .notNull()
      .unique(),

    subtotal: numeric("subtotal", {
      precision: 14,
      scale: 2,
    }).notNull(),

    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),

    paidAmount: numeric("paid_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),

    changeAmount: numeric("change_amount", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),

    paymentMethod: paymentMethodEnum("payment_method").notNull(),

    status: saleStatusEnum("status").default("menunggu").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sales_created_at_idx").on(table.createdAt),

    index("sales_cashier_idx").on(table.cashierId),
  ],
);

export const invoice = pgTable(
  "invoice",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    saleId: integer("sale_id")
      .notNull()
      .references(() => sales.id, {
        onDelete: "restrict",
      }),

    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),

    // Snapshot data produk saat transaksi.
    productName: varchar("product_name", {
      length: 150,
    }).notNull(),

    barcode: varchar("barcode", {
      length: 100,
    }),

    quantity: integer("quantity").notNull(),

    price: numeric("price", {
      precision: 14,
      scale: 2,
    }).notNull(),

    subtotal: numeric("subtotal", {
      precision: 14,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    index("sale_items_sale_idx").on(table.saleId),

    index("sale_items_product_idx").on(table.productId),

    check("sale_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);
