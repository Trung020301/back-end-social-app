import { IsOptional } from 'class-validator'
import { UploadFileDto } from '../cloudinary/uploadFile.dto'

export class CreatePostDto extends UploadFileDto {
  @IsOptional()
  content: string
}
