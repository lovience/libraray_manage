import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Book from "../models/Book.js";
import Borrow from "../models/Borrow.js";
import User from "../models/User.js";

const activeStatuses = ["borrowed", "overdue"];

const refreshOverdues = async () => {
  await Borrow.updateMany(
    { status: "borrowed", dueAt: { $lt: new Date() } },
    { $set: { status: "overdue" } }
  );
};

export const getBorrows = asyncHandler(async (req, res) => {
  await refreshOverdues();

  const { status = "active", userId } = req.query;
  const query = {};

  if (req.user.role === "member") {
    query.user = req.user._id;
  } else if (userId) {
    query.user = userId;
  }

  if (status === "active") {
    query.status = { $in: activeStatuses };
  } else if (status !== "all") {
    query.status = status;
  }

  const borrows = await Borrow.find(query)
    .populate("user", "name email role membershipId")
    .populate("book", "title author isbn category coverColor")
    .populate("issuedBy", "name role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: borrows.length,
    borrows
  });
});

export const checkoutBook = asyncHandler(async (req, res) => {
  const { bookId, userId, dueDays = 14, notes = "" } = req.body;

  if (!bookId) {
    throw new ApiError(400, "Book is required");
  }

  const loanDays = Number(dueDays);
  if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > 90) {
    throw new ApiError(400, "Loan period must be between 1 and 90 days");
  }

  let borrowerId = req.user._id;

  if (["admin", "librarian"].includes(req.user.role) && userId) {
    borrowerId = userId;
  }

  if (req.user.role === "member" && userId && `${userId}` !== `${req.user._id}`) {
    throw new ApiError(403, "Members can only borrow books for themselves");
  }

  const borrower = await User.findById(borrowerId);
  if (!borrower || borrower.status !== "active") {
    throw new ApiError(404, "Borrower not found or inactive");
  }

  const existingBorrow = await Borrow.findOne({
    user: borrowerId,
    book: bookId,
    status: { $in: activeStatuses }
  });

  if (existingBorrow) {
    throw new ApiError(409, "This borrower already has an active loan for this book");
  }

  const book = await Book.findOneAndUpdate(
    { _id: bookId, status: "active", availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );

  if (!book) {
    throw new ApiError(400, "Book is unavailable");
  }

  try {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + loanDays);

    const borrow = await Borrow.create({
      user: borrowerId,
      book: bookId,
      issuedBy: req.user._id,
      dueAt,
      notes
    });

    const populated = await borrow.populate([
      { path: "user", select: "name email role membershipId" },
      { path: "book", select: "title author isbn category coverColor" },
      { path: "issuedBy", select: "name role" }
    ]);

    res.status(201).json({
      success: true,
      borrow: populated
    });
  } catch (error) {
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
    throw error;
  }
});

export const returnBook = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);

  if (!borrow) {
    throw new ApiError(404, "Loan not found");
  }

  if (req.user.role === "member" && `${borrow.user}` !== `${req.user._id}`) {
    throw new ApiError(403, "You can only return your own loans");
  }

  if (borrow.status === "returned") {
    throw new ApiError(400, "This book has already been returned");
  }

  borrow.status = "returned";
  borrow.returnedAt = new Date();
  await borrow.save();

  await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });

  const populated = await borrow.populate([
    { path: "user", select: "name email role membershipId" },
    { path: "book", select: "title author isbn category coverColor" },
    { path: "issuedBy", select: "name role" }
  ]);

  res.json({
    success: true,
    borrow: populated
  });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  await refreshOverdues();

  const [bookStats] = await Book.aggregate([
    { $match: { status: "active" } },
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        totalCopies: { $sum: "$totalCopies" },
        availableCopies: { $sum: "$availableCopies" }
      }
    }
  ]);

  const memberCount = await User.countDocuments({ role: "member", status: "active" });
  const activeLoans = await Borrow.countDocuments({ status: { $in: activeStatuses } });
  const overdueLoans = await Borrow.countDocuments({ status: "overdue" });
  const returnedThisMonth = await Borrow.countDocuments({
    status: "returned",
    returnedAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });

  const recentBorrows = await Borrow.find(
    req.user.role === "member" ? { user: req.user._id } : {}
  )
    .populate("user", "name email membershipId")
    .populate("book", "title author coverColor")
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    success: true,
    stats: {
      totalBooks: bookStats?.totalBooks || 0,
      totalCopies: bookStats?.totalCopies || 0,
      availableCopies: bookStats?.availableCopies || 0,
      memberCount,
      activeLoans,
      overdueLoans,
      returnedThisMonth
    },
    recentBorrows
  });
});
