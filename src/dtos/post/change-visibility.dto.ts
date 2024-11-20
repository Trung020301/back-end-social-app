import { IsNotEmpty, IsString } from 'class-validator'
import { Types } from 'mongoose'
import { VisibilityPostEnum } from 'src/util/enum'

export class ChangeVisibilityPostDto {
  @IsNotEmpty()
  postId: Types.ObjectId

  @IsNotEmpty()
  @IsString()
  visibility: VisibilityPostEnum
}
