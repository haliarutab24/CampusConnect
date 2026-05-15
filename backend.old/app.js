import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./db/connectDB.js";

import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import Cloudinary from "./src/utils/cloudinary.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧩 Connect MongoDB safely
connectDB();
Cloudinary();


app.get("/", (req, res) => res.send("✅ API is working fine on Vercel"));

app.use("/user", userRoutes);
app.use("/company", companyRoutes);
app.use("/job", jobRoutes);
app.use("/recommendation", recommendationRoutes);
app.use("/notification", notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
