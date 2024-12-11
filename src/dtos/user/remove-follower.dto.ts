import mongoose from 'mongoose'
import { IsNotEmpty } from 'class-validator'

export class RemoveFollowerDto {
  @IsNotEmpty()
  followerId: mongoose.Types.ObjectId
}
