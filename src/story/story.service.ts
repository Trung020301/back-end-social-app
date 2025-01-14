import mongoose, { Model } from 'mongoose'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Story } from 'src/schema/story.schema'
import { User } from 'src/schema/user.schema'
import { CreateStoryDto } from 'src/dtos/story/create-story.dto'
import { USER_NOT_FOUND } from 'src/util/constant'

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private StoryModel: Model<Story>,
    @InjectModel(User.name) private UserModel: Model<User>,
  ) {}

  async createStory(
    userId: mongoose.Types.ObjectId,
    createStoryDto: CreateStoryDto,
  ) {
    await this.findUserById(userId)
    const story = new this.StoryModel({
      ...createStoryDto,
      userId,
    })
    await story.save()
  }

  // Common function
  async findUserById(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }
    return user
  }
}
