import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { ToggleFollowUserDto } from 'src/dtos/user/toggle-follow-user.dto'
import { UpdatePasswordDto } from 'src/dtos/user/update-password.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { InteractUserDto } from 'src/dtos/user/interact-user.dto'
import { Response } from 'express'
import { ToggleSavePostDto } from 'src/dtos/post/save-post.dto'
import { RemoveFollowerDto } from 'src/dtos/user/remove-follower.dto'
import { ReportPostDto } from 'src/dtos/user/report_port.dto'
import { UnHidePostDto } from 'src/dtos/user/unhide-post.dto'
import { SharedPostDto } from 'src/dtos/user/share-post.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ? [GET METHOD] *********************************************************************
  @Get('get-my-profile')
  async getMyProfile(@Req() req) {
    return this.userService.getMyProfile(req.user.userId)
  }

  @Get('follow/get-followers')
  async getFollowers(@Req() req, @Res() res: Response) {
    return this.userService.getFollowers(req.user.userId, req, res)
  }

  @Get('follow/get-following')
  async getFollowing(@Req() req, @Res() res: Response) {
    return this.userService.getFollowing(req.user.userId, req, res)
  }

  @Get('feed/news-feed')
  async getNewsFeed(@Req() req, @Res() res: Response) {
    return this.userService.getNewsFeed(req.user.userId, req, res)
  }

  @Get('explore-user')
  async exploreUser(@Req() req, @Res() res: Response) {
    return this.userService.getExploreUsers(req.user.userId, req, res)
  }

  @Get('explore-user/:username')
  async exploreUserFromUserProfile(
    @Req() req,
    @Param()
    params: {
      username: string
    },
    @Res() res: Response,
  ) {
    return this.userService.getExploreUserFromUserProfile(
      req.user.userId,
      params.username,
      req,
      res,
    )
  }

  @Get('find-user')
  async getUserByQuery(@Req() req, @Query() query, @Res() res: Response) {
    return this.userService.getUserByQuery(req.user.userId, query.q, res)
  }

  @Get('blocked-list')
  async getBlockedUsers(@Req() req, @Res() res: Response) {
    return this.userService.getBlockedUsers(req.user.userId, res)
  }

  @Get(':username')
  async getUserByUsername(@Req() req, @Param() params: { username: string }) {
    return this.userService.getUserByUsername(req.user.userId, params.username)
  }

  @Get(':username/followers')
  async getUserFollowers(
    @Req() req,
    @Param() params: { username: string },
    @Res() res: Response,
  ) {
    return this.userService.getUserFollowers(
      req.user.userId,
      params.username,
      req,
      res,
    )
  }

  @Get(':username/following')
  async getUserFollowing(
    @Req() req,
    @Param() params: { username: string },
    @Res() res: Response,
  ) {
    return this.userService.getUserFollowing(
      req.user.userId,
      params.username,
      req,
      res,
    )
  }

  @Get('archives/saved-posts')
  async getSavedPosts(@Req() req, @Res() res: Response) {
    return this.userService.getSavedPosts(req.user.userId, req, res)
  }

  @Get('archives/posts-hidden')
  async getHiddenPosts(@Req() req, @Res() res: Response) {
    return this.userService.getPostsHidden(req.user.userId, req, res)
  }

  @Get('share/get-shared-posts')
  async getSharedPosts(@Req() req, @Res() res: Response) {
    return this.userService.getPostShared(req.user.userId, req, res)
  }

  @Get('share/get-shared-posts/:username')
  async getSharedPostsByUsername(
    @Req() req,
    @Param() params: { username: string },
    @Res() res: Response,
  ) {
    return this.userService.getSharedPostByUsername(
      req.user.userId,
      params.username,
      req,
      res,
    )
  }

  // ? [POST METHOD] *********************************************************************

  @Post('check-admin')
  async checkUserIsAdmin(@Req() req) {
    return this.userService.checkUserIsAdmin(req.user.userId)
  }

  @Post('toggle-follow-user')
  async toggleFollowUser(
    @Req() req,
    @Body() toggleFollowUser: ToggleFollowUserDto,
  ) {
    return this.userService.toggleFollowUser(
      req.user.userId,
      toggleFollowUser.targetUserId,
    )
  }

  @Post('save-post')
  async toggleSavePost(
    @Req() req,
    @Body() toggleSavePostDto: ToggleSavePostDto,
  ) {
    return this.userService.toggleSavePost(
      req.user.userId,
      toggleSavePostDto.postId,
    )
  }

  @Post('remove-follower')
  async removeFollower(
    @Req() req,
    @Body() removeFollowerDto: RemoveFollowerDto,
  ) {
    return this.userService.removeFollower(
      req.user.userId,
      removeFollowerDto.followerId,
    )
  }

  @Post('report/post')
  async reportPost(@Req() req, @Body() ReportPostDto: ReportPostDto) {
    return this.userService.reportPost(req.user.userId, ReportPostDto)
  }

  @Post('archives/unhide-post')
  async unhidePost(@Req() req, @Body() unhidePostDto: UnHidePostDto) {
    return this.userService.unhidePosts(req.user.userId, unhidePostDto)
  }

  @Post('share/create')
  async sharePost(@Req() req, @Body() sharePostDto: SharedPostDto) {
    return this.userService.sharePost(req.user.userId, sharePostDto.postId)
  }

  @Delete('share/remove')
  async removeSharedPost(@Req() req, @Body() sharePostDto: SharedPostDto) {
    return this.userService.removePostShared(
      req.user.userId,
      sharePostDto.postId,
    )
  }

  // ? [UPDATE METHOD] *********************************************************************
  @Patch('update-profile')
  async updateProfile(@Req() req, @Body() body) {
    return this.userService.updateProfile(req.user.userId, body)
  }

  @Put('change-password')
  async updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(req.user.userId, updatePasswordDto)
  }

  @Put('change-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.userService.changeAvatar(req.user.userId, file)
  }

  @Post('interact/block-user')
  async blockUser(@Req() req, @Body() blockUserDto: InteractUserDto) {
    return this.userService.blockUser(
      req.user.userId,
      blockUserDto.targetUserId,
    )
  }

  @Post('interact/unblock-user')
  async unblockUser(@Req() req, @Body() unblockUserDto: InteractUserDto) {
    return this.userService.unblockUser(
      req.user.userId,
      unblockUserDto.targetUserId,
    )
  }

  // ? [DELETE METHOD] *********************************************************************
  @Delete()
  async deleteMyAccount(@Req() req) {
    return this.userService.deleteMyAccount(req.user.userId)
  }
}
