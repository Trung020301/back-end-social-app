import { IsString } from 'class-validator'
import { CloudinaryResourceTypeEnum } from 'src/util/enum'

export class UploadFileDto {
  @IsString()
  folder: string

  @IsString()
  resourceType: CloudinaryResourceTypeEnum
}
