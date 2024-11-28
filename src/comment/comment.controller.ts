import { Body, Controller, Post, Req } from '@nestjs/common'
import { CommentService } from './comment.service'
import { CreateCommentDto } from 'src/dtos/comment/create-comment.dto'

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // ? [GET METHOD] *********************************************************************

  // ? [POST METHOD] *********************************************************************
  @Post('/create')
  async createComment(@Req() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(req.user.userId, createCommentDto)
  }
}
