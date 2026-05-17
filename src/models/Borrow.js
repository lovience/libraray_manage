import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    borrowedAt: {
      type: Date,
      default: Date.now
    },
    dueAt: {
      type: Date,
      required: true
    },
    returnedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue", "lost"],
      default: "borrowed"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
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

borrowSchema.virtual("fineAmount").get(function fineAmount() {
  const endDate = this.returnedAt || new Date();
  if (!this.dueAt || endDate <= this.dueAt) {
    return 0;
  }

  const overdueDays = Math.ceil((endDate - this.dueAt) / (1000 * 60 * 60 * 24));
  return overdueDays * 1;
});

borrowSchema.index({ user: 1, book: 1, status: 1 });
borrowSchema.index({ dueAt: 1, status: 1 });

const Borrow = mongoose.model("Borrow", borrowSchema);

export default Borrow;
