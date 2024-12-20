import mongoose from 'mongoose'
import { IsNotEmpty } from 'class-validator'

export class UnHidePostDto {
  @IsNotEmpty()
  unhidePostId: mongoose.Types.ObjectId
}
