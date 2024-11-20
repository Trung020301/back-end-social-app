import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response } from 'express'
import { Model, Types } from 'mongoose'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { ChangeVisibilityPostDto } from 'src/dtos/post/change-visibility.dto'
import { CreatePostDto } from 'src/dtos/post/create-post.dto'
import { Post } from 'src/schema/post.schema'
import { User } from 'src/schema/user.schema'
import { APIFeatures } from 'src/util/apiFeatures'
import { SUCCESS, USER_NOT_FOUND } from 'src/util/constant'
import { VisibilityPostEnum } from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<Post>,
    @InjectModel(User.name) private UserModel: Model<User>,
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
    const mediaUrl = uploadFiles.map((file) => ({
      url: file.secure_url,
      public_id: file.public_id,
    }))
    await this.PostModel.create({
      ...createPostDto,
      userId,
      mediaUrl,
      content: createPostDto?.content,
      MediaTypeEnum: createPostDto.resourceType,
    })
  }

  async getAllMyPosts(userId: Types.ObjectId, req: Request, res: Response) {
    const features = new APIFeatures(
      this.PostModel.find({
        userId,
      }),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const posts = await features.mongooseQuery
    res.status(200).json({
      status: SUCCESS,
      data: {
        posts,
      },
    })
  }

  async getPostByUsername(
    username: string,
    requestUserId: Types.ObjectId,
    res: Response,
    req: Request,
  ) {
    const user = await this.UserModel.findOne({ username })
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }

    const features = new APIFeatures(
      this.PostModel.find({ userId: user._id.toString() }),
      req.query,
    )
      .filter()
      .limit()
      .sorting()
      .pagination()

    const posts = await features.mongooseQuery
    const filteredPosts = posts.filter((post) => {
      if (post.visibility === VisibilityPostEnum.public) {
        return true // Mọi người đều có thể xem
      } else if (post.visibility === VisibilityPostEnum.followers) {
        // Kiểm tra xem người dùng thực hiện yêu cầu có phải là người theo dõi không
        return user.followers.includes(requestUserId)
      } else if (post.visibility === VisibilityPostEnum.private) {
        return false // Không ai có thể xem
      }
    })
    res.status(200).json({
      status: SUCCESS,
      data: {
        posts: filteredPosts,
      },
    })
  }

  async toggleLikePost(requestUserId: Types.ObjectId, postId: Types.ObjectId) {
    const post = await this.findPostById(postId)
    const isLikedPost = post.likes.includes(requestUserId)

    if (isLikedPost) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== requestUserId.toString(),
      )
    } else {
      post.likes = [...post.likes, requestUserId]
    }
    await post.save()
    return {
      isLikePost: !isLikedPost,
    }
  }

  async updatePostVisibility(
    requestUserId: Types.ObjectId,
    changeVisibilityDto: ChangeVisibilityPostDto,
  ) {
    const post = await this.findPostById(changeVisibilityDto.postId)
    if (post.userId.toString() !== requestUserId.toString()) {
      throw new NotFoundException('Bạn không có quyền thay đổi bài viết này')
    }
    post.visibility = changeVisibilityDto.visibility
    await post.save()
  }

  async deletePost(requestUserId: Types.ObjectId, postId: Types.ObjectId) {
    const post = await this.findPostById(postId)
    if (post.userId.toString() !== requestUserId.toString()) {
      throw new NotFoundException('Bạn không có quyền xóa bài viết này')
    }
  }

  // * Common function
  private async findPostById(postId: Types.ObjectId) {
    const post = await this.PostModel.findById(postId)
    if (!post) throw new NotFoundException('Post not found')
    return post
  }

  async deletedImage(publicIds: ImageInterface[]) {
    await this.cloudinaryService.delteFiles(publicIds)
  }
}
