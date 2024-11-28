import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { CommentService } from './comment.service'
import { CommentController } from './comment.controller'
import { Comment, CommentSchema } from 'src/schema/comment.schema'
import { Post, PostSchema } from 'src/schema/post.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
