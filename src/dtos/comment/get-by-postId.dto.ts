import { IsNotEmpty } from 'class-validator'
import mongoose from 'mongoose'

export class GetCommentByPostIdDto {
  @IsNotEmpty()
  postId: mongoose.Types.ObjectId
}
