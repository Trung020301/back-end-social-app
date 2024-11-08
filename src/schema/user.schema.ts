import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Role } from 'src/util/enum'

export type UserDocument = HydratedDocument<User>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ isRequired: true })
  fullname: string

  @Prop({ isRequired: true, unique: true })
  username: string

  @Prop({ isRequired: true })
  password: string

  @Prop({ default: '' })
  email: string

  @Prop({ default: '' })
  bio: string

  @Prop({ default: '' })
  avatar: string

  @Prop({ default: false })
  hasStory: boolean

  @Prop({ default: Role.User })
  role: string

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  blocked: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post' })
  savedPosts: mongoose.Types.ObjectId[]
}

export const UserSchema = SchemaFactory.createForClass(User)
