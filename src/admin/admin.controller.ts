import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common'
import { AdminService } from './admin.service'
import { Roles } from 'src/decorators/role.decorator'
import { Role } from 'src/util/enum'
import { BanUserDto } from 'src/dtos/admin/ban-user.dto'
import { Response } from 'express'
import { Types } from 'mongoose'
import { DetelePostsDto } from 'src/dtos/admin/delete-posts.dto'
import { ChangeStatusResolveDto } from 'src/dtos/admin/change-status-resolve.dto'

@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  //? [GET METHOD] *********************************************************************
  @Get('users')
  async getUsers(@Req() req, @Res() res) {
    return this.adminService.getUsers(req, res)
  }

  @Get('posts/reported')
  async getReportedPosts(@Req() req, @Res() res: Response) {
    return this.adminService.getPostsHasReport(req, res)
  }

  @Get('posts/detail/:postId')
  async getPost(@Param() params: { postId: Types.ObjectId }) {
    return this.adminService.getPost(params.postId)
  }
  //? [POST METHOD] *********************************************************************
  @Post('banned-user')
  async banUser(
    @Req() req,
    @Body() bannedId: BanUserDto,
    @Res() res: Response,
  ) {
    return this.adminService.banUserByUserId(
      req.user.userId,
      bannedId.userId,
      res,
    )
  }

  //? [UPDATE METHOD] *********************************************************************
  @Patch('posts/resovle-report')
  async resolveReportedPost(
    @Body()
    changeStatusResolveDto: ChangeStatusResolveDto,
    @Res() res: Response,
  ) {
    return this.adminService.resolveReportedPost(changeStatusResolveDto, res)
  }

  //? [DELETE METHOD] *********************************************************************
  @Delete('posts/delete/:postId')
  async deletePostByPostId(
    @Param() params: { postId: Types.ObjectId },
    @Res() res: Response,
  ) {
    return this.adminService.deletePostByPostId(params.postId, res)
  }

  @Delete('posts/delete')
  async deletePosts(
    @Body() deletePostsDto: DetelePostsDto,
    @Res() res: Response,
  ) {
    return this.adminService.deletePosts(deletePostsDto, res)
  }
}
