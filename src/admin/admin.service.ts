import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Request, Response } from 'express'
import { Model } from 'mongoose'
import { User, UserDocument } from 'src/schema/user.schema'
import { APIFeatures } from 'src/util/apiFeatures'
import { SUCCESS } from 'src/util/constant'

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
}
