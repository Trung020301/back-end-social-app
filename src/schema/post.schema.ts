import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, HydratedDocument } from 'mongoose'
import { MediaTypeEnum, VisibilityPostEnum } from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

export type PostDocument = HydratedDocument<Post>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Post extends Document {
  @Prop({
    required: true,
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  userId: mongoose.Types.ObjectId

  @Prop()
  content?: string

  @Prop({ enum: MediaTypeEnum, required: true })
  MediaTypeEnum: MediaTypeEnum

  @Prop()
  mediaUrl: ImageInterface[]

  @Prop({ default: VisibilityPostEnum.public })
  visibility: VisibilityPostEnum

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  likes: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Comment', default: [] })
  comments: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  shares: mongoose.Types.ObjectId[]
}

export const PostSchema = SchemaFactory.createForClass(Post)
