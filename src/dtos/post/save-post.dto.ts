import mongoose from 'mongoose'
import { IsNotEmpty } from 'class-validator'

export class ToggleSavePostDto {
  @IsNotEmpty()
  postId: mongoose.Types.ObjectId
}
