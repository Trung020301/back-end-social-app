import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { Model } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { UpdatePasswordDto } from 'src/dtos/user/update-password.dto'
import { User } from 'src/schema/user.schema'
import { USER_NOT_FOUND } from 'src/util/constant'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private UserModel: Model<User>) {}

  // ? [GET METHOD] *********************************************************************

  async getMyProfile(userId: mongoose.Types.ObjectId): Promise<User> {
    const user = await this.UserModel.findById(userId).select('-password')
    if (!user) throw new NotFoundException(USER_NOT_FOUND)

    return user
  }

  async getUserByUsername(username: string) {
    const user = await this.UserModel.findOne({
      username,
    })
    if (!user) throw new NotFoundException(USER_NOT_FOUND)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, password, ...result } = user.toObject()
    return result
  }

  // * [FOLLOW]
  async getFollowers(
    userId: mongoose.Types.ObjectId,
  ): Promise<mongoose.Types.ObjectId[]> {
    const user = await this.UserModel.findById(userId)
    return user.followers
  }

  async getFollowing(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)

    return user.following
  }

  // ? [POST METHOD] *********************************************************************

  async toggleFollowUser(
    userId: mongoose.Types.ObjectId,
    targetUserId: mongoose.Types.ObjectId,
  ) {
    if (userId.toString() === targetUserId.toString())
      throw new BadRequestException('Bạn không thể theo dõi bản thân mình.')
    const user = await this.findUserById(userId)
    const targetUser = await this.findUserById(targetUserId)
    if (!user || !targetUser) throw new NotFoundException(USER_NOT_FOUND)
    const isFollowing = user.following.includes(targetUserId)
    user.following = isFollowing
      ? user.following.filter((id) => id.toString() !== targetUserId.toString())
      : [...user.following, targetUserId]
    targetUser.followers = isFollowing
      ? targetUser.followers.filter((id) => id.toString() !== userId.toString())
      : [...targetUser.followers, userId]
    await user.save()
    await targetUser.save()
    return {
      isFollowing: !isFollowing,
    }
  }

  async updatePassword(
    userId: mongoose.Types.ObjectId,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.findUserById(userId)
    await this.validatePasswords(updatePasswordDto, user.password)
    user.password = await this.hashPassword(updatePasswordDto.newPassword)
    await user.save()
  }

  // ? [PATCH METHOD] *********************************************************************

  async updateProfile(
    userId: mongoose.Types.ObjectId,
    updateProfile: Partial<User>,
  ) {
    const user = await this.findUserById(userId)
    Object.assign(user, updateProfile)
    await user.save()
    return user
  }

  // ? [PUT METHOD] *********************************************************************
  async updateAvatar(userId: mongoose.Types.ObjectId, avatar: string) {
    const user = await this.findUserById(userId)
    user.avatar = avatar
    await user.save()
  }

  // * Common function
  private async findUserById(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) throw new NotFoundException(USER_NOT_FOUND)
    return user
  }

  // * Custom function
  private async validatePasswords(
    updatePasswordDto: UpdatePasswordDto,
    currentPassword: string,
  ) {
    const { oldPassword, newPassword } = updatePasswordDto

    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ',
      )
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, currentPassword)
    if (!isPasswordMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng')
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  }
}
