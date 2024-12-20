import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, HydratedDocument } from 'mongoose'

export type ReportedPostDocument = HydratedDocument<ReportedPost>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ReportedPost extends Document {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  requestUserId: mongoose.Types.ObjectId

  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'Post' })
  reportedPostId: mongoose.Types.ObjectId

  @Prop({ default: '', maxlength: 500 })
  reason: string

  @Prop({ default: false })
  resolved: boolean
}

export const ReportedPostSchema = SchemaFactory.createForClass(ReportedPost)
