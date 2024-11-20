import { Controller, Get, Req, Res } from '@nestjs/common'
import { AdminService } from './admin.service'
import { Roles } from 'src/decorators/role.decorator'
import { Role } from 'src/util/enum'

@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Req() req, @Res() res) {
    return this.adminService.getUsers(req, res)
  }
}
