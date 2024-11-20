import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { PostService } from './post.service'
import { CreatePostDto } from 'src/dtos/post/create-post.dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ToggleLikePostDto } from 'src/dtos/post/toggle-like-post.dto'
import { ChangeVisibilityPostDto } from 'src/dtos/post/change-visibility.dto'
import { DeletePostDto } from 'src/dtos/post/delete-post.dto'

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

  @Get('get-all-posts')
  async getAllMyPosts(@Req() req, @Res() res) {
    return this.postService.getAllMyPosts(req.user.userId, req, res)
  }

  @Get('collection/:username')
  async getPostsByUsername(
    @Res() res,
    @Req() req,
    @Param()
    params: {
      username: string
    },
  ) {
    return this.postService.getPostByUsername(
      params.username,
      req.user.userId,
      res,
      req,
    )
  }

  @Post('interact-post')
  async toggleLikePost(@Req() req, @Body() payloadData: ToggleLikePostDto) {
    return this.postService.toggleLikePost(req.user.userId, payloadData.postId)
  }

  @Patch('update-visibility')
  async updateVisibilityPost(
    @Req() req,
    @Body() changeVisibilityDto: ChangeVisibilityPostDto,
  ) {
    return this.postService.updatePostVisibility(
      req.user.userId,
      changeVisibilityDto,
    )
  }

  @Delete()
  async deletePost(@Req() req, @Body() deletePostDto: DeletePostDto) {
    return this.postService.deletePost(req.user.userId, deletePostDto.postId)
  }
}
