"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { getProducts } from "@/utils/product";
import type { Product } from "@/utils/productType";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getProducts(controller.signal)
      .then(setProducts)
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError("Produk gagal dimuat. Coba lagi ya.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { products, loading, error, reload };
}