import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Book from "../models/Book.js";
import Borrow from "../models/Borrow.js";

const activeLoanFilter = { status: { $in: ["borrowed", "overdue"] } };

export const getBooks = asyncHandler(async (req, res) => {
  const { search = "", category, status = "active", available } = req.query;
  const query = {};

  if (status !== "all") query.status = status;
  if (category && category !== "all") query.category = category;
  if (available === "true") query.availableCopies = { $gt: 0 };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { isbn: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }

  const books = await Book.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: books.length,
    books
  });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  res.json({
    success: true,
    book
  });
});

export const createBook = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    availableCopies: req.body.availableCopies ?? req.body.totalCopies ?? 1
  };

  if (payload.availableCopies > payload.totalCopies) {
    throw new ApiError(400, "Available copies cannot exceed total copies");
  }

  const book = await Book.create(payload);

  res.status(201).json({
    success: true,
    book
  });
});

export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  const borrowedCount = await Borrow.countDocuments({
    book: book._id,
    ...activeLoanFilter
  });

  const nextTotal = req.body.totalCopies ?? book.totalCopies;
  if (nextTotal < borrowedCount) {
    throw new ApiError(400, `Total copies cannot be lower than ${borrowedCount} active loans`);
  }

  const allowedFields = [
    "title",
    "author",
    "isbn",
    "category",
    "publisher",
    "publishedYear",
    "description",
    "coverColor",
    "totalCopies",
    "shelfLocation",
    "tags",
    "status"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      book[field] = req.body[field];
    }
  });

  if (req.body.totalCopies !== undefined) {
    book.availableCopies = nextTotal - borrowedCount;
  }

  await book.save();

  res.json({
    success: true,
    book
  });
});

export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    throw new ApiError(404, "Book not found");
  }

  const activeLoans = await Borrow.countDocuments({
    book: book._id,
    ...activeLoanFilter
  });

  if (activeLoans > 0) {
    throw new ApiError(400, "This book has active loans and cannot be removed");
  }

  await book.deleteOne();

  res.json({
    success: true,
    message: "Book removed"
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct("category", { status: "active" });

  res.json({
    success: true,
    categories: categories.sort()
  });
});

