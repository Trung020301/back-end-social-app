import { Model, Types } from 'mongoose'
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Comment } from 'src/schema/comment.schema'
import { CreateCommentDto } from 'src/dtos/comment/create-comment.dto'
import { Post } from 'src/schema/post.schema'
import { POST_NOT_FOUND } from 'src/util/constant'
import { VisibilityPostEnum } from 'src/util/enum'

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  async createComment(
    userId: Types.ObjectId,
    createCommentDto: CreateCommentDto,
  ) {
    const post = await this.findPostById(createCommentDto.postId)

    const isPostVisible = post.visibility !== VisibilityPostEnum.private
    const isPostOwner = post.userId.toString() === userId.toString()

    if (isPostVisible || isPostOwner) {
      const newComment = new this.commentModel({
        ...createCommentDto,
        userId,
      })
      await newComment.save()
      await post.updateOne({ $push: { comments: newComment._id } })
    } else {
      throw new UnauthorizedException('Bạn không có quyền làm điều này.')
    }
  }

  // * Common functions
  private async findPostById(postId: Types.ObjectId) {
    const post = await this.postModel.findById(postId)
    if (!post) throw new NotFoundException(POST_NOT_FOUND)
    return post
  }
}
