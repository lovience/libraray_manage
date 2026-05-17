import express from "express";
import {
  createBook,
  deleteBook,
  getBook,
  getBooks,
  getCategories,
  updateBook
} from "../controllers/bookController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/categories", getCategories);
router.route("/").get(getBooks).post(authorize("admin", "librarian"), createBook);
router
  .route("/:id")
  .get(getBook)
  .patch(authorize("admin", "librarian"), updateBook)
  .delete(authorize("admin"), deleteBook);

export default router;

