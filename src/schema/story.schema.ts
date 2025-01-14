import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, HydratedDocument } from 'mongoose'
import { VisibilityPostEnum } from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

export type StoryDocument = HydratedDocument<Story>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Story extends Document {
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId

  @Prop()
  mediaUrl: ImageInterface[]

  @Prop({ default: VisibilityPostEnum.public })
  visibility: VisibilityPostEnum

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  views: mongoose.Types.ObjectId[]

  @Prop({ default: 15 })
  duration: number

  @Prop()
  expiresAt: Date
}

export const StorySchema = SchemaFactory.createForClass(Story)
