const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const morgan = require("morgan");
const path = require('path'); 
const http = require('http');
const { Server } = require("socket.io");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const friendRoutes = require("./src/routes/friendRoutes");
const registerSocketRoutes = require("./src/routes/socketRoutes");
const errorHandler = require('./src/middlewares/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN;
console.log("CORS Origin set to:", corsOrigin);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan("dev")); 

/**
 * 2. WEBSOCKET LOGIC
 */
registerSocketRoutes(io);


// Existing Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/friends", friendRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
