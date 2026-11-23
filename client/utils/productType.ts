export type StockStatus = "available" | "low" | "out";

export interface Product {
  id: string | number;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  status: StockStatus;
}