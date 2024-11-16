import { Schema, model, Document, Types } from "mongoose";

interface IVerification extends Document {
  user: Types.ObjectId;
  token: string;
  expiry: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Verification = model<IVerification>("Verification", verificationSchema);

export { Verification, IVerification };
