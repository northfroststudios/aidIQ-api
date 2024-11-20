import { Document, Schema, Types, model } from "mongoose";

interface IMembership extends Document {
  user_id: Types.ObjectId;
  team_id: Types.ObjectId;
  is_active: boolean;
  role: "creator" | "admin" | "staff" | "customer";
  created_at?: Date;
  updated_at?: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    role: {
      type: String,
      enum: ["creator", "admin", "staff", "customer"],
      required: true,
      default: "staff",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Membership = model<IMembership>("Membership", membershipSchema);

export { IMembership, Membership };
