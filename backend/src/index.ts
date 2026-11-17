import express from "express";
import auth from "./routes/auth.routes";
import resetPassword from "./routes/resetPassword.routes";
import product from "./routes/product.routes";

import cors from "cors";

const app = express();
const PORT = 8000;

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use("/auth", auth);
app.use("/reset", resetPassword);
app.use("/product", product);

app.get("/", (req, res) => {
  res.send("Hello Express + TypeScript!");
});

app.get("/tes", (req, res) => {
  res.send("Hello Express + TypeScript! 2222222");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Documentation api running on http://localhost:${PORT}/api-docs`);
});
