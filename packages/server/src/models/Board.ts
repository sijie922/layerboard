import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGroup {
  id: string;
  name: string;
  members: Types.ObjectId[];
  color: string;
}

export interface IArea {
  id: string;
  groupId: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  layers: ILayer[];
  createdAt: Date;
}

export interface ILayer {
  id: string;
  label: string;
  index: number;
  content: {
    stickyNotes: IStickyNote[];
    tables: ITable[];
    drawings: IDrawing[];
    timestamps: ITimeStamp[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IStickyNote {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  color: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface ITable {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  columns: string[];
  rows: string[][];
}

export interface IDrawing {
  id: string;
  position: { x: number; y: number };
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[];
}

export interface ITimeStamp {
  id: string;
  text: string;
  position: { x: number; y: number };
  createdAt: Date;
}

export interface IBoard extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  groups: IGroup[];
  areas: IArea[];
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groups: [
      {
        id: String,
        name: String,
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        color: { type: String, default: '#1890ff' },
      },
    ],
    areas: [
      {
        id: String,
        groupId: String,
        name: String,
        position: { x: Number, y: Number },
        size: { width: Number, height: Number },
        layers: [
          {
            id: String,
            label: String,
            index: Number,
            content: {
              stickyNotes: [
                {
                  id: String,
                  position: { x: Number, y: Number },
                  size: { width: Number, height: Number },
                  content: String,
                  color: String,
                  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
                  createdAt: Date,
                },
              ],
              tables: [
                {
                  id: String,
                  position: { x: Number, y: Number },
                  size: { width: Number, height: Number },
                  columns: [String],
                  rows: [[String]],
                },
              ],
              drawings: [
                {
                  id: String,
                  position: { x: Number, y: Number },
                  strokes: [
                    {
                      points: [{ x: Number, y: Number }],
                      color: String,
                      width: Number,
                    },
                  ],
                },
              ],
              timestamps: [
                {
                  id: String,
                  text: String,
                  position: { x: Number, y: Number },
                  createdAt: Date,
                },
              ],
            },
            createdAt: Date,
            updatedAt: Date,
          },
        ],
        createdAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
boardSchema.index({ createdBy: 1 });
boardSchema.index({ members: 1 });

export const Board = mongoose.model<IBoard>('Board', boardSchema);
