// cloudinary.service.ts

import { Injectable } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryResponse } from './cloudinary-response'
import * as streamifier from 'streamifier'
import { UploadFileDto } from 'src/dtos/cloudinary/uploadFile.dto'
import { ImageInterface } from 'src/util/interface'

// TODO: Config size of image/video upload

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: uploadFileDto.resourceType,
          folder: uploadFileDto.folder,
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        },
      )

      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }

  uploadFiles(
    files: Express.Multer.File[],
    uploadFileDto: UploadFileDto,
  ): Promise<CloudinaryResponse[]> {
    return Promise.all(
      files.map((file) => this.uploadFile(file, uploadFileDto)),
    )
  }

  deleteFile(publicId: string): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error)
        resolve(result)
      })
    })
  }

  delteFiles(publicIds: ImageInterface[]): Promise<CloudinaryResponse[]> {
    return Promise.all(
      publicIds.map((publicId) => this.deleteFile(publicId.public_id)),
    )
  }
}
