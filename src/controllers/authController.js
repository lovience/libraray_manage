import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import User from "../models/User.js";

const sendAuthResponse = (res, user, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    token: generateToken(user._id),
    user
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: "member",
    membershipId: `MEM-${Date.now()}`
  });

  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "This account is inactive");
  }

  if (role && user.role !== role) {
    throw new ApiError(403, "This account does not match the selected portal");
  }

  sendAuthResponse(res, user);
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const editableFields = ["name", "phone", "address"];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();

  res.json({
    success: true,
    user: req.user
  });
});

