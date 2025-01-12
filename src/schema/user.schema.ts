import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import {
  AccountStatusEnum,
  Role,
  TypeGenderUserEnum,
  TypeStatusAccountEnum,
} from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

export type UserDocument = HydratedDocument<User>

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ isRequired: true })
  fullName: string

  @Prop({ isRequired: true, unique: true })
  username: string

  @Prop({ isRequired: true })
  password: string

  @Prop({ default: '' })
  email: string

  @Prop({ default: '' })
  phone: string

  @Prop({ default: TypeGenderUserEnum.other })
  gender: TypeGenderUserEnum

  @Prop({ default: '' })
  bio: string

  @Prop({ type: Object, default: {} })
  avatar: ImageInterface

  @Prop({ default: false })
  hasStory: boolean

  @Prop({ default: AccountStatusEnum.public })
  accountStatus: AccountStatusEnum

  @Prop({ default: Role.User })
  role: string

  @Prop({
    default: TypeStatusAccountEnum.active,
  })
  status: TypeStatusAccountEnum

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    default: [],
  })
  followers: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  following: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: [] })
  blockedUsers: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post', default: [] })
  savedPosts: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post', default: [] })
  sharedPosts: mongoose.Types.ObjectId[]

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Post', default: [] })
  postsHidden: mongoose.Types.ObjectId[]
}

export const UserSchema = SchemaFactory.createForClass(User)
