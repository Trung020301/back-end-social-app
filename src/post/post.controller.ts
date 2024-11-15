import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { PostService } from './post.service'
import { CreatePostDto } from 'src/dtos/post/create-post.dto'
import { FilesInterceptor } from '@nestjs/platform-express'

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create-post')
  @UseInterceptors(FilesInterceptor('files'))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postService.createPost(createPostDto, req.user.userId, files)
  }
}
