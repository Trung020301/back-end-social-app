import mongoose from 'mongoose'
import { IsNotEmpty } from 'class-validator'

export class ToggleFollowUserDto {
  @IsNotEmpty()
  targetUserId: mongoose.Types.ObjectId
}
