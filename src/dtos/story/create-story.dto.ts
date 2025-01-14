import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator'
import { Types } from 'mongoose'
import { VisibilityPostEnum } from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

export class CreateStoryDto {
  @IsMongoId()
  userId: Types.ObjectId

  @IsNotEmpty()
  mediaUrl: ImageInterface[]

  @IsOptional()
  visibility: VisibilityPostEnum

  @IsOptional()
  duration: number
}
