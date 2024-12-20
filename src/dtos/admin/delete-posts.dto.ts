import mongoose from 'mongoose'
import { IsNotEmpty } from 'class-validator'

export class DetelePostsDto {
  @IsNotEmpty()
  postIds: mongoose.Types.ObjectId[]
}
