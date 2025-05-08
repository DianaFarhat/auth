// Imports
const express= require('express');
const { connectToDatabase } = require('./database');
const app= express();
//const userRouter=require("./routes/userRouter"); 
const cors = require('cors');
const cookieParser = require("cookie-parser");



// Load environment variables from a .env file into process.env in your Node.js app
const dotenv=require("dotenv"); 
dotenv.config();

// Run the database connection
connectToDatabase();

//Add necessary middleware
app.use(express.json());
app.use(cookieParser()); 

// CORS Configuration
app.use(cors({
    origin: "http://localhost:3000", // Allow your frontend domain
    credentials: true, // Allow credentials like cookies
}));
app.options('*', cors());

// Routes
//app.use("/api/users", userRouter);

app.get("/", (req,res)=>{res.send("hello from the backend")})



// Start Server on Port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
