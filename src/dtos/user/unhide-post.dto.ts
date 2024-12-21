import mongoose from 'mongoose'
import { IsArray, IsNotEmpty } from 'class-validator'

export class UnHidePostDto {
  @IsNotEmpty()
  @IsArray()
  unhidePostIds: mongoose.Types.ObjectId[]
}
