import { IsNotEmpty } from 'class-validator'
import mongoose from 'mongoose'

export class CreateCommentDto {
  @IsNotEmpty()
  content: string

  @IsNotEmpty()
  postId: mongoose.Types.ObjectId
}
