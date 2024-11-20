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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResourceTypeEnum } from 'src/util/enum'
import { RefreshToken } from 'src/schema/refresh-token.schema'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ? [GET METHOD] *********************************************************************

  async getMyProfile(userId: mongoose.Types.ObjectId): Promise<User> {
    const user = await this.UserModel.findById(userId).select('-password')
    if (!user) throw new NotFoundException(USER_NOT_FOUND)

    return user
  }

  async getUserByUsername(userId: mongoose.Types.ObjectId, username: string) {
    const user = await this.UserModel.findOne({
      username,
    })
    if (user.blockedUsers.includes(userId))
      throw new BadRequestException('Người dùng này không tồn tại!')

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
  ): Promise<{
    isFollowing: boolean
  }> {
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
  async changeAvatar(
    userId: mongoose.Types.ObjectId,
    file: Express.Multer.File,
  ) {
    const user = await this.findUserById(userId)
    const uploadUrl = await this.cloudinaryService.uploadFile(file, {
      resourceType: CloudinaryResourceTypeEnum.image,
      folder: 'avatars',
    })
    if (user.avatar.public_id) this.deleteAvatar(user.avatar.public_id)
    user.avatar = {
      public_id: uploadUrl.public_id,
      url: uploadUrl.url,
    }
    await user.save()
  }

  // ? [DELETE METHOD] *********************************************************************
  async deleteMyAccount(userId: mongoose.Types.ObjectId) {
    const user = await this.findUserById(userId)
    const { avatar, followers, following } = user

    const token = await this.RefreshTokenModel.findOneAndDelete(userId)
    if (!token) throw new NotFoundException('Token không tồn tại')

    if (avatar.public_id) this.deleteAvatar(avatar.public_id)

    await this.UserModel.updateMany(
      { _id: { $in: followers } },
      { $pull: { following: userId } },
    )

    await this.UserModel.updateMany(
      { _id: { $in: following } },
      { $pull: { followers: userId } },
    )

    await this.UserModel.findByIdAndDelete(userId)
  }

  async blockUser(
    userId: mongoose.Types.ObjectId,
    targetUserId: mongoose.Types.ObjectId,
  ) {
    if (userId.toString() === targetUserId.toString())
      throw new BadRequestException('Bạn không thể chặn bản thân mình')
    const user = await this.findUserById(userId)
    const targetUser = await this.findUserById(targetUserId)
    if (!user || !targetUser) throw new NotFoundException(USER_NOT_FOUND)
    if (user.blockedUsers.includes(targetUserId))
      throw new BadRequestException('Người dùng này đã bị chặn')
    user.blockedUsers = [...user.blockedUsers, targetUserId]
    await user.save()
  }

  async unblockUser(
    userId: mongoose.Types.ObjectId,
    targetUserId: mongoose.Types.ObjectId,
  ) {
    const user = await this.findUserById(userId)
    if (!user.blockedUsers.includes(targetUserId))
      throw new BadRequestException('Người dùng này chưa bị chặn')
    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== targetUserId.toString(),
    )
    await user.save()
  }

  // * Common function
  async findUserById(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) throw new NotFoundException(USER_NOT_FOUND)
    return user
  }

  private async deleteAvatar(public_id: string) {
    await this.cloudinaryService.deleteFile(public_id)
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
