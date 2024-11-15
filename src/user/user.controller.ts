import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common'
import { UserService } from './user.service'
import { ToggleFollowUserDto } from 'src/dtos/user/toggle-follow-user.dto'
import { UpdatePasswordDto } from 'src/dtos/user/update-password.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get-my-profile')
  async getMyProfile(@Req() req) {
    return this.userService.getMyProfile(req.user.userId)
  }

  @Get('follow/get-followers')
  async getFollowers(@Req() req) {
    return this.userService.getFollowers(req.user.userId)
  }

  @Get('follow/get-following')
  async getFollowing(@Req() req) {
    return this.userService.getFollowing(req.user.userId)
  }

  @Get(':username')
  async getUserByUsername(@Param() params: { username: string }) {
    return this.userService.getUserByUsername(params.username)
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
}
