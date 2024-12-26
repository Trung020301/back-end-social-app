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
import {
  NOT_FOUND,
  NOT_FOUND_IN_USER,
  SUCCESS,
  USER_NOT_FOUND,
} from 'src/util/constant'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResourceTypeEnum, VisibilityPostEnum } from 'src/util/enum'
import { RefreshToken } from 'src/schema/refresh-token.schema'
import { Request, Response } from 'express'
import { Post } from 'src/schema/post.schema'
import { APIFeatures } from 'src/util/apiFeatures'
import { ReportPostDto } from 'src/dtos/user/report_port.dto'
import { ReportedPost } from 'src/schema/reported-post.schema'
import { UnHidePostDto } from 'src/dtos/user/unhide-post.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Post.name) private PostModel: Model<Post>,
    @InjectModel(ReportedPost.name)
    private ReportedPostModel: Model<ReportedPost>,
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
    const requestUser = await this.findUserById(userId)
    const isUserHasBeenBlocked = requestUser.blockedUsers.includes(user.id)

    if (!user || isUserHasBeenBlocked)
      throw new NotFoundException(USER_NOT_FOUND)
    if (user._id.toString() === userId.toString())
      return {
        status: 302,
        message: 'Bạn đang xem trang cá nhân của mình',
      }

    if (user.blockedUsers.includes(userId))
      throw new NotFoundException('Người dùng này không tồn tại!')

    const posts = await this.PostModel.find({ userId: user.id }).sort({
      createdAt: -1,
    })

    const totalPosts = posts.length

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, password, ...result } = user.toObject()

    return {
      user: result,
      posts: totalPosts,
    }
  }

  async getUserByQuery(
    userId: mongoose.Types.ObjectId,
    query: string,
    res: Response,
  ) {
    const user = await this.findUserById(userId)
    const blockedUsers = user.blockedUsers
    const users = await this.UserModel.find({
      username: { $regex: query, $options: 'i' },
      _id: { $nin: blockedUsers, $ne: userId },
    })

    const checkYouHasBeenBlocked = users.filter((user: User) =>
      user.blockedUsers.includes(userId),
    )
    const filterUser = users.filter(
      (user) => !checkYouHasBeenBlocked.includes(user),
    )

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: filterUser,
      },
    })
  }

  // * [FOLLOW]
  async getFollowers(
    userId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(userId)
    const features = new APIFeatures(
      this.UserModel.find({
        _id: { $in: user.followers },
      }).select('_id username fullName avatar.url'),
      req.query,
    )
      .limit()
      .filter()
      .sorting()
      .pagination()

    const users = await features.mongooseQuery

    res.status(200).json({
      status: SUCCESS,
      data: {
        followers: users,
      },
    })
  }

  async getFollowing(
    userId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(userId)
    const features = new APIFeatures(
      this.UserModel.find({
        _id: { $in: user.following },
      }).select('_id username fullName avatar.url'),
      req.query,
    )
      .limit()
      .filter()
      .sorting()
      .pagination()

    const users = await features.mongooseQuery

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: users,
      },
    })
  }

  async getBlockedUsers(userId: mongoose.Types.ObjectId, res: Response) {
    const user = await this.findUserById(userId)
    const features = new APIFeatures(
      this.UserModel.find({ _id: { $in: user.blockedUsers } }).select(
        '_id username fullName avatar.url',
      ),
      {},
    )
      .limit()
      .filter()
      .sorting()
      .pagination()

    const users = await features.mongooseQuery

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: users,
      },
    })
  }

  async getNewsFeed(
    userId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(userId)

    const followingUserIds = user.following.map((id) => id.toString())
    const blockedUserIds = user.blockedUsers.map((id) => id.toString())
    const postsHidden = user.postsHidden.map((id) => id.toString())

    console.log('PostHidden >>> ', postsHidden)

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
        _id: { $nin: postsHidden },
      }).populate('userId', 'username fullName avatar.url'),
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
    const listUserHasFollowed = user.following.map((id) => id.toString())
    const select = '_id username fullName avatar blockedUsers followers'

    const features = new APIFeatures(
      this.UserModel.find({
        _id: {
          $nin: [...blockedUserIds, userId, ...listUserHasFollowed],
        },
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

  async getExploreUserFromUserProfile(
    userId: mongoose.Types.ObjectId,
    username: string,
    req: Request,
    res: Response,
  ) {
    const requestUser = await this.findUserById(userId)
    const targetUser = await this.UserModel.findOne({ username })

    if (!targetUser) throw new NotFoundException(USER_NOT_FOUND)

    const blockedUserIds = requestUser.blockedUsers.map((id) => id.toString())
    const listUserHasFollowed = requestUser.following.map((id) => id.toString())
    const select = '_id username fullName avatar blockedUsers followers'

    const features = new APIFeatures(
      this.UserModel.find({
        _id: {
          $nin: [
            ...blockedUserIds,
            userId,
            targetUser._id,
            ...listUserHasFollowed,
          ],
        },
      }).select(select),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const users = await features.mongooseQuery

    const filterUser = this.filterBlockedUsers(users, userId)

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: filterUser,
      },
    })
  }

  async getUserFollowers(
    requestUserId: mongoose.Types.ObjectId,
    username: string,
    req: Request,
    res: Response,
  ) {
    const user = await this.UserModel.findOne({ username })
    if (!user) throw new NotFoundException(USER_NOT_FOUND)

    const features = new APIFeatures(
      this.UserModel.find({
        _id: { $in: user.followers },
      }).select('_id username fullName avatar.url blockedUsers'),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const users = await features.mongooseQuery

    const filterUser = this.filterBlockedUsers(users, requestUserId)
    // Tìm xem các user trả về có trong danh sách chặn của người dùng không

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: filterUser,
      },
    })
  }

  async getUserFollowing(
    requestUserId: mongoose.Types.ObjectId,
    username: string,
    req: Request,
    res: Response,
  ) {
    const user = await this.UserModel.findOne({ username })
    if (!user) throw new NotFoundException(USER_NOT_FOUND)
    const features = new APIFeatures(
      this.UserModel.find({ _id: { $in: user.following } }).select(
        '_id username fullName avatar.url blockedUsers',
      ),
      req.query,
    )
      .filter()
      .sorting()
      .limit()
      .pagination()

    const users = await features.mongooseQuery
    const filterUser = this.filterBlockedUsers(users, requestUserId)

    res.status(200).json({
      status: SUCCESS,
      data: {
        users: filterUser,
      },
    })
  }

  async getSavedPosts(
    requestUserId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(requestUserId)
    const features = new APIFeatures(
      this.PostModel.find({ _id: { $in: user.savedPosts } }).populate(
        'userId',
        'username fullName avatar.url',
      ),
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
  async getPostsHidden(
    requestUserId: mongoose.Types.ObjectId,
    req: Request,
    res: Response,
  ) {
    const user = await this.findUserById(requestUserId)
    const features = new APIFeatures(
      this.PostModel.find({ _id: { $in: user.postsHidden } }).populate(
        'userId',
        'username fullName avatar.url',
      ),
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

  // ? [POST METHOD] *********************************************************************

  async checkUserIsAdmin(userId: mongoose.Types.ObjectId) {
    const user = await this.findUserById(userId)
    return {
      isAdmin: user.role === 'admin',
    }
  }

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

  async unhidePosts(
    userId: mongoose.Types.ObjectId,
    unhidePostIds: UnHidePostDto,
  ) {
    const user = await this.findUserById(userId)
    const convertPostIds = user.postsHidden.map((id) => id.toString())
    const checkPostIdsExist = unhidePostIds.unhidePostIds.every((id) =>
      convertPostIds.includes(id.toString()),
    )

    if (!checkPostIdsExist) throw new NotFoundException(NOT_FOUND_IN_USER)
    user.postsHidden = user.postsHidden.filter(
      (id) => !unhidePostIds.unhidePostIds.toString().includes(id.toString()),
    )
    await user.save()
  }

  //?  [UPDATE METHOD] *********************************************************************
  async updatePassword(
    userId: mongoose.Types.ObjectId,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.findUserById(userId)
    await this.validatePasswords(updatePasswordDto, user.password)
    user.password = await this.hashPassword(updatePasswordDto.newPassword)
    await user.save()
  }

  async removeFollower(
    userId: mongoose.Types.ObjectId,
    followerId: mongoose.Types.ObjectId,
  ) {
    const user = await this.findUserById(userId)
    const follower = await this.findUserById(followerId)
    if (!user || !follower) throw new NotFoundException(USER_NOT_FOUND)

    const checkFollowerId = user.followers.includes(followerId)
    if (!checkFollowerId)
      throw new NotFoundException(
        'Người dùng này không tồn tại trong danh sách theo dõi của bạn.',
      )

    user.followers = user.followers.filter(
      (id) => id.toString() !== followerId.toString(),
    )
    follower.following = follower.following.filter(
      (id) => id.toString() !== userId.toString(),
    )
    await user.save()
    await follower.save()
  }

  async reportPost(
    requestUserId: mongoose.Types.ObjectId,
    reportPortDto: ReportPostDto,
  ) {
    const post = await this.PostModel.findById(reportPortDto.reportedPostId)
    if (!post) throw new NotFoundException(NOT_FOUND)

    if (post.userId === requestUserId)
      throw new BadRequestException(
        ' bạn không thể báo cáo bài viết của chính mình',
      )

    const newReportedPost = new this.ReportedPostModel({
      requestUserId,
      ...reportPortDto,
    })
    await this.UserModel.findByIdAndUpdate(
      requestUserId,
      {
        $push: {
          postsHidden: post._id,
        },
      },
      { new: true },
    )

    await newReportedPost.save()
  }

  async updateProfile(
    userId: mongoose.Types.ObjectId,
    updateProfile: Partial<User>,
  ) {
    const user = await this.findUserById(userId)
    Object.assign(user, updateProfile)
    await user.save()
    return user
  }

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

    const isFollowTargetUser = user.following.includes(targetUserId)
    const isTargetUserFollowYou = targetUser.following.includes(userId)

    if (!user || !targetUser) throw new NotFoundException(USER_NOT_FOUND)
    if (user.blockedUsers.includes(targetUserId))
      throw new BadRequestException('Người dùng này đã bị chặn')
    user.blockedUsers = [...user.blockedUsers, targetUserId]

    if (isFollowTargetUser) {
      user.following = user.following.filter(
        (id) => id.toString() !== targetUserId.toString(),
      )
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== userId.toString(),
      )
    }

    if (isTargetUserFollowYou) {
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== userId.toString(),
      )
      user.following = user.following.filter(
        (id) => id.toString() !== targetUserId.toString(),
      )
    }

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

  private filterBlockedUsers(
    users: User[],
    requestUserId: mongoose.Types.ObjectId,
  ): User[] {
    const checkYouHasBeenBlocked = users.filter((user: User) =>
      user.blockedUsers.includes(requestUserId),
    )
    return users.filter((user: User) => !checkYouHasBeenBlocked.includes(user))
  }

  private checkUserHasBeenBlocked(
    user: User,
    requestUserId: mongoose.Types.ObjectId,
  ): boolean {
    return user.blockedUsers.includes(requestUserId)
  }
}
