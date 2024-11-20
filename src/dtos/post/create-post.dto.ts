import { IsOptional } from 'class-validator'
import { UploadFileDto } from '../cloudinary/uploadFile.dto'
import { VisibilityPostEnum } from 'src/util/enum'

export class CreatePostDto extends UploadFileDto {
  @IsOptional()
  content: string

  @IsOptional()
  visibility: VisibilityPostEnum
}
