import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CreatePostDto } from 'src/dtos/post/create-post.dto'
import { Post } from 'src/schema/post.schema'

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<Post>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    userId: Types.ObjectId,
    files: Express.Multer.File[],
  ) {
    const uploadFiles = await this.cloudinaryService.uploadFiles(
      files,
      createPostDto,
    )
    const mediaUrl = uploadFiles.map((file) => file.url)
    await this.PostModel.create({
      userId,
      mediaUrl,
      content: createPostDto?.content,
      MediaTypeEnum: createPostDto.resourceType,
    })
  }
}
