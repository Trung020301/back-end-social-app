import { Body, Controller, Post, Req, Res } from '@nestjs/common'
import { CommentService } from './comment.service'
import { CreateCommentDto } from 'src/dtos/comment/create-comment.dto'
import { GetCommentByPostIdDto } from 'src/dtos/comment/get-by-postId.dto'
import { Response } from 'express'

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // ? [GET METHOD] *********************************************************************

  // ? [POST METHOD] *********************************************************************
  @Post('/create')
  async createComment(@Req() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, createCommentDto)
  }

  @Post('/')
  async getCommentByPostId(
    @Body() body: GetCommentByPostIdDto,
    @Req() req,
    @Res() res: Response,
  ) {
    return this.commentService.getCommentByPostId(body.postId, req, res)
  }
}
