import { IsNotEmpty } from 'class-validator'
import { Types } from 'mongoose'

export class ToggleLikePostDto {
  @IsNotEmpty()
  postId: Types.ObjectId
}
