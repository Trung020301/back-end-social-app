import { IsNotEmpty, IsOptional } from 'class-validator'
import { Types } from 'mongoose'
import { CloudinaryResourceTypeEnum, VisibilityPostEnum } from 'src/util/enum'

export class UpdatePostDto {
  @IsNotEmpty()
  postId: Types.ObjectId

  @IsOptional()
  content: string

  @IsOptional()
  visibility: VisibilityPostEnum

  @IsOptional()
  files: Express.Multer.File[]

  @IsOptional()
  resourceType: CloudinaryResourceTypeEnum
}
