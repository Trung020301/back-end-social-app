import { IsNotEmpty } from 'class-validator'
import mongoose from 'mongoose'

export class BanUserDto {
  @IsNotEmpty()
  userId: mongoose.Types.ObjectId
}
