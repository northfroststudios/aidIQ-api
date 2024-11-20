import { Document, Schema, Types, model } from "mongoose";

interface ITeam extends Document {
  name: string;
  user_id: Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

const Team = model<ITeam>("Team", teamSchema);

export { ITeam, Team };
