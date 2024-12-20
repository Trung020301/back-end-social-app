import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response } from 'express'
import mongoose, { Model } from 'mongoose'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { DetelePostsDto } from 'src/dtos/admin/delete-posts.dto'
import { Post } from 'src/schema/post.schema'
import { ReportedPost } from 'src/schema/reported-post.schema'
import { User, UserDocument } from 'src/schema/user.schema'
import { APIFeatures } from 'src/util/apiFeatures'
import { FAILURE, SUCCESS, USER_NOT_FOUND } from 'src/util/constant'
import { TypeStatusAccountEnum } from 'src/util/enum'
import { ImageInterface } from 'src/util/interface'

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<UserDocument>,
    @InjectModel(ReportedPost.name)
    private ReportedPostModel: Model<ReportedPost>,
    @InjectModel(Post.name) private PostModel: Model<Post>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //? [GET METHOD] *********************************************************************
  async getUsers(req: Request, res: Response) {
    const features = new APIFeatures(this.UserModel.find(), req.query)
      .filter()
      .sorting()
      .limit()
      .pagination()
    const users = await features.mongooseQuery

    res.status(200).json({
      status: SUCCESS,
      data: {
        users,
      },
    })
  }

  async getPostsHasReport(req: Request, res: Response) {
    const features = new APIFeatures(this.ReportedPostModel.find(), req.query)
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

  //? [POST METHOD] *********************************************************************
  async banUserByUserId(
    requestUserId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    res: Response,
  ) {
    if (requestUserId.toString() === userId.toString()) {
      return res.status(400).json({
        status: FAILURE,
        message: 'You cannot ban yourself',
      })
    }

    const user = await this.findUserByUserId(userId)
    if (user.status === TypeStatusAccountEnum.banned) {
      return res.status(400).json({
        status: FAILURE,
        message: 'User is already banned',
      })
    }

    user.status = TypeStatusAccountEnum.banned
    await user.save()
    return res.status(200).json({
      status: SUCCESS,
      message: 'Ban user successfully',
    })
  }

  //? [UPDATE METHOD] *********************************************************************

  //? [DELETE METHOD] *********************************************************************
  async deletePosts(
    req: Request,
    deletePostsDto: DetelePostsDto,
    res: Response,
  ) {
    const posts = await this.PostModel.find({
      _id: { $in: deletePostsDto.postIds },
    })
    if (posts.length === 0) {
      return res.status(400).json({
        status: FAILURE,
        message: 'Posts not found',
      })
    }

    await this.PostModel.deleteMany({
      _id: { $in: deletePostsDto.postIds },
    })

    await this.deletedImage(posts.flatMap((post) => post.mediaUrl))

    return res.status(200).json({
      status: SUCCESS,
      message: 'Delete posts successfully',
    })
  }

  // *Common function*
  async findUserByUserId(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }
    return user
  }

  async deletedImage(publicIds: ImageInterface[]) {
    await this.cloudinaryService.delteFiles(publicIds)
  }
}
