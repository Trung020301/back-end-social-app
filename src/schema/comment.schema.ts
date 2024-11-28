import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, HydratedDocument } from 'mongoose'

export type CommentDocument = HydratedDocument<Comment>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Comment extends Document {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId

  @Prop({ required: true, type: String })
  content: string

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post' })
  postId: mongoose.Types.ObjectId

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Comment' })
  parentId: mongoose.Types.ObjectId

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Comment', default: [] })
  replies: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  likes: mongoose.Types.ObjectId[]

  @Prop({ default: 0 })
  likesCount: number
}

export const CommentSchema = SchemaFactory.createForClass(Comment)
