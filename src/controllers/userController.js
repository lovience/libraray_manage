import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search = "" } = req.query;
  const query = {};

  if (role) query.role = role;
  if (req.user.role === "librarian") query.role = "member";
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { membershipId: { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    users
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "member", phone, address, status = "active" } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    address,
    status,
    membershipId: role === "member" ? `MEM-${Date.now()}` : undefined
  });

  res.status(201).json({
    success: true,
    user
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowedFields = ["name", "email", "role", "phone", "address", "status"];

  if (id === req.user.id && req.body.status === "inactive") {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    user
  });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user.id) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status: "inactive" },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json({
    success: true,
    user
  });
});
