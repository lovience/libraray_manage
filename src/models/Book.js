import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },
    publisher: {
      type: String,
      trim: true,
      default: ""
    },
    publishedYear: {
      type: Number,
      min: [1000, "Published year is invalid"],
      max: [2100, "Published year is invalid"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    coverColor: {
      type: String,
      default: "#2563eb"
    },
    totalCopies: {
      type: Number,
      required: [true, "Total copies is required"],
      min: [0, "Total copies cannot be negative"],
      default: 1
    },
    availableCopies: {
      type: Number,
      required: [true, "Available copies is required"],
      min: [0, "Available copies cannot be negative"],
      default: 1
    },
    shelfLocation: {
      type: String,
      trim: true,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active"
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

bookSchema.virtual("borrowedCopies").get(function borrowedCopies() {
  return Math.max((this.totalCopies || 0) - (this.availableCopies || 0), 0);
});

bookSchema.index({ title: "text", author: "text", isbn: "text", category: "text" });

const Book = mongoose.model("Book", bookSchema);

export default Book;

