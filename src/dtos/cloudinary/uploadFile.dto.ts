import { IsOptional, IsString } from 'class-validator'
import { CloudinaryResourceTypeEnum } from 'src/util/enum'

export class UploadFileDto {
  @IsOptional()
  folder: string

  @IsString()
  resourceType: CloudinaryResourceTypeEnum
}
