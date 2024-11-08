import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type PostDocument = HydratedDocument<Post>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Post {
  @Prop({ isRequired: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId

  @Prop({ isRequired: true })
  images: string[]

  @Prop()
  content?: string

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  likes: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post', default: [] })
  comments: mongoose.Types.ObjectId[]
}

export const PostSchema = SchemaFactory.createForClass(Post)
