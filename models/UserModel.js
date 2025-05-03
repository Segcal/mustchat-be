import mongoose from "mongoose";
import { genSaltSync, hash } from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    image: {
        type: String,
    },
    color: {
        type: Number,
    },
    profileSetup: {
        type: Boolean,
        default: false,
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // Hash only if password is modified
    const salt = genSaltSync(10);
    this.password = await hash(this.password, salt);
    next();
});

const User = mongoose.model("User", userSchema);

export default User;
