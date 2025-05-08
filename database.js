const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables (assumes .env is in the backend folder)
dotenv.config({ path: './.env' });

mongoose.set('strictQuery', true);

// Debug: print the environment variables loaded by dotenv
console.log('Loaded environment variables:', process.env);

const DB_URL = process.env.DB_URL;

// Connect to DB
exports.connectToDatabase = async () => {
    try {
        if (!DB_URL) {
            throw new Error("Database URL not found in environment variables.");
        }

        await mongoose.connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connection to MongoDB established successfully!');
        
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
