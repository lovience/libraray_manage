import express from "express";
import {
  createUser,
  deactivateUser,
  getUsers,
  updateUser
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(authorize("admin", "librarian"), getUsers).post(authorize("admin"), createUser);
router.route("/:id").patch(authorize("admin"), updateUser).delete(authorize("admin"), deactivateUser);

export default router;
