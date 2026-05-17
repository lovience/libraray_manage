import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Book from "./models/Book.js";
import User from "./models/User.js";

// Load environment from the backend folder regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const password = await bcrypt.hash("password123", 12);

const users = [
  {
    name: "Aarav Admin",
    email: "admin@library.com",
    password,
    role: "admin",
    phone: "+1 555 100 1000",
    address: "Central Library Office",
    status: "active"
  },
  {
    name: "Lina Librarian",
    email: "librarian@library.com",
    password,
    role: "librarian",
    phone: "+1 555 200 2000",
    address: "Main Circulation Desk",
    status: "active"
  },
  {
    name: "Maya Member",
    email: "member@library.com",
    password,
    role: "member",
    phone: "+1 555 300 3000",
    address: "24 Reader Lane",
    membershipId: "MEM-10001",
    status: "active"
  }
];

const books = [
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    category: "Software Engineering",
    publisher: "Prentice Hall",
    publishedYear: 2008,
    description: "A practical guide to writing maintainable software.",
    coverColor: "#2563eb",
    totalCopies: 8,
    availableCopies: 8,
    shelfLocation: "A1-04",
    tags: ["programming", "engineering", "craft"]
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    category: "Self Development",
    publisher: "Avery",
    publishedYear: 2018,
    description: "Tiny changes, remarkable results.",
    coverColor: "#f97316",
    totalCopies: 10,
    availableCopies: 10,
    shelfLocation: "B2-11",
    tags: ["habits", "productivity"]
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    isbn: "9780201616224",
    category: "Software Engineering",
    publisher: "Addison-Wesley",
    publishedYear: 1999,
    description: "Timeless practices for professional programmers.",
    coverColor: "#0f766e",
    totalCopies: 6,
    availableCopies: 6,
    shelfLocation: "A1-07",
    tags: ["programming", "career"]
  },
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "9781449373320",
    category: "Databases",
    publisher: "O'Reilly Media",
    publishedYear: 2017,
    description: "The big ideas behind reliable, scalable, maintainable systems.",
    coverColor: "#7c3aed",
    totalCopies: 5,
    availableCopies: 5,
    shelfLocation: "C3-02",
    tags: ["databases", "distributed systems"]
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    isbn: "9780857197689",
    category: "Finance",
    publisher: "Harriman House",
    publishedYear: 2020,
    description: "Lessons on wealth, greed, and happiness.",
    coverColor: "#16a34a",
    totalCopies: 7,
    availableCopies: 7,
    shelfLocation: "D4-08",
    tags: ["finance", "behavior"]
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    category: "Science Fiction",
    publisher: "Ballantine Books",
    publishedYear: 2021,
    description: "A lone astronaut attempts to save humanity.",
    coverColor: "#dc2626",
    totalCopies: 4,
    availableCopies: 4,
    shelfLocation: "F2-03",
    tags: ["fiction", "space"]
  }
];

const seed = async () => {
  try {
    await connectDB();

    for (const user of users) {
      await User.findOneAndUpdate(
        { email: user.email },
        { $set: user },
        { upsert: true, new: true, runValidators: true }
      );
    }

    for (const book of books) {
      await Book.findOneAndUpdate(
        { isbn: book.isbn },
        { $setOnInsert: book },
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log("Seed complete");
    console.log("Admin: admin@library.com / password123");
    console.log("Librarian: librarian@library.com / password123");
    console.log("Member: member@library.com / password123");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
