import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response } from 'express'
import mongoose, { Model } from 'mongoose'
import { User, UserDocument } from 'src/schema/user.schema'
import { APIFeatures } from 'src/util/apiFeatures'
import { FAILURE, SUCCESS, USER_NOT_FOUND } from 'src/util/constant'
import { TypeStatusAccountEnum } from 'src/util/enum'

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<UserDocument>,
  ) {}

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

  // *Common function*
  async findUserByUserId(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }
    return user
  }
}
