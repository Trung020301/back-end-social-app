import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { CloudinaryService } from './cloudinary.service'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { Public } from 'src/decorators/public.decorator'
import { UploadFileDto } from 'src/dtos/cloudinary/uploadFile.dto'

@Public()
@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return this.cloudinaryService.uploadFile(file, uploadFileDto)
  }

  @Post('files')
  @UseInterceptors(FilesInterceptor('files'))
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return this.cloudinaryService.uploadFiles(files, uploadFileDto)
  }
}
