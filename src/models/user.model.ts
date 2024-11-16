import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_active: boolean;
}

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const User = model("User", userSchema);

export { User, IUser };
