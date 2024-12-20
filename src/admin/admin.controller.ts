import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common'
import { AdminService } from './admin.service'
import { Roles } from 'src/decorators/role.decorator'
import { Role } from 'src/util/enum'
import { BanUserDto } from 'src/dtos/admin/ban-user.dto'
import { Response } from 'express'

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

  //? [DELETE METHOD] *********************************************************************
}
