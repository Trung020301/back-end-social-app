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
import { SUCCESS, USER_NOT_FOUND } from 'src/util/constant'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResourceTypeEnum, VisibilityPostEnum } from 'src/util/enum'
import { RefreshToken } from 'src/schema/refresh-token.schema'
import { Request, Response } from 'express'
import { Post } from 'src/schema/post.schema'
import { APIFeatures } from 'src/util/apiFeatures'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Post.name) private PostModel: Model<Post>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ? [GET METHOD] *********************************************************************

  async getMyProfile(userId: mongoose.Types.ObjectId) {
    const user = await this.UserModel.findById(userId).select('-password')
    if (!user) throw new NotFoundException(USER_NOT_FOUND)
    const posts = await this.PostModel.find({ userId }).sort({ createdAt: -1 })

    return {
      user,
      posts,
    }
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

  async getNewsFeed(
    userId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(userId)

    const followingUserIds = user.following.map((id) => id.toString())
    const blockedUserIds = user.blockedUsers.map((id) => id.toString())

    const features = new APIFeatures(
      this.PostModel.find({
        $or: [
          {
            visibility: VisibilityPostEnum.public,
          },
          {
            $and: [
              { visibility: VisibilityPostEnum.followers },
              { userId: followingUserIds },
            ],
          },
        ],
        userId: { $nin: blockedUserIds },
      })
        .populate('userId', 'username fullName avatar.url')
        .populate('comments'),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const posts = await features.mongooseQuery

    const filteredPosts = await Promise.all(
      posts.map(async (post: Post) => {
        const author = await this.findUserById(post.userId)
        if (author.blockedUsers.includes(userId)) return null

        // Kiểm tra xem người dùng đã "like" bài viết hay chưa
        const isLikedPost = post.likes.includes(userId)
        const isSavedPost = user.savedPosts.includes(post.id)

        // Thêm trường isLikedPost vào bài viết
        return {
          ...post.toObject(), // Chuyển đổi post sang đối tượng thông thường
          isLikedPost,
          isSavedPost,
        }
      }),
    )

    const finalPosts = filteredPosts.filter((post) => post !== null)

    res.status(200).json({
      status: SUCCESS,
      data: {
        posts: finalPosts,
      },
    })
  }

  async getExploreUsers(
    userId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(userId)
    const blockedUserIds = user.blockedUsers.map((id) => id.toString())
    const select = '_id username fullName avatar blockedUsers followers'

    const features = new APIFeatures(
      this.UserModel.find({
        _id: { $nin: blockedUserIds, $ne: userId },
      }).select(select),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const users = await features.mongooseQuery
    const checkYouHasBeenBlocked = users.filter((user: User) =>
      user.blockedUsers.includes(userId),
    )
    const filterUser: User[] = users.filter(
      (user: User) => !checkYouHasBeenBlocked.includes(user),
    )

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: filterUser,
      },
    })
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

  async toggleSavePost(
    userId: mongoose.Types.ObjectId,
    postId: mongoose.Types.ObjectId,
  ): Promise<{
    isSavedPost: boolean
  }> {
    const user = await this.findUserById(userId)
    if (user.savedPosts.includes(postId)) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString(),
      )
      await user.save()
    } else {
      user.savedPosts = [...user.savedPosts, postId]
      await user.save()
    }
    return {
      isSavedPost: user.savedPosts.includes(postId),
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

    const checkTargetUserIdHasFollowed = targetUser.following.includes(userId)
    const checkTargetUserHasFollower = user.followers.includes(targetUserId)

    if (!user || !targetUser) throw new NotFoundException(USER_NOT_FOUND)
    if (user.blockedUsers.includes(targetUserId))
      throw new BadRequestException('Người dùng này đã bị chặn')
    user.blockedUsers = [...user.blockedUsers, targetUserId]

    if (checkTargetUserHasFollower)
      user.followers = user.followers.filter(
        (id) => id.toString() !== targetUserId.toString(),
      )

    if (checkTargetUserIdHasFollowed)
      targetUser.following = targetUser.following.filter(
        (id) => id.toString() !== userId.toString(),
      )

    await user.save()
    await targetUser.save()
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
