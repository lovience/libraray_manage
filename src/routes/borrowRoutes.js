import express from "express";
import {
  checkoutBook,
  getBorrows,
  returnBook
} from "../controllers/borrowController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getBorrows).post(checkoutBook);
router.patch("/:id/return", authorize("admin", "librarian", "member"), returnBook);

export default router;

