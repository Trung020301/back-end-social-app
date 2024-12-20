import mongoose from 'mongoose'
import { IsNotEmpty, MaxLength } from 'class-validator'

export class ReportPostDto {
  @IsNotEmpty()
  @MaxLength(500)
  reason: string

  @IsNotEmpty()
  reportedPostId: mongoose.Types.ObjectId
}
