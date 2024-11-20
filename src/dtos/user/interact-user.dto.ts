import { IsNotEmpty } from 'class-validator'
import mongoose from 'mongoose'

export class InteractUserDto {
  @IsNotEmpty()
  targetUserId: mongoose.Types.ObjectId
}
