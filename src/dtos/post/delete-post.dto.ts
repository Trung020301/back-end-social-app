import { IsNotEmpty } from 'class-validator'
import { Types } from 'mongoose'

export class DeletePostDto {
  @IsNotEmpty()
  postId: Types.ObjectId
}
