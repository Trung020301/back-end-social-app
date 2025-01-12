import { IsMongoId, IsNotEmpty } from 'class-validator'
import { Types } from 'mongoose'

export class SharedPostDto {
  @IsMongoId()
  @IsNotEmpty()
  postId: Types.ObjectId
}
