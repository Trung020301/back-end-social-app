import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { UserService } from 'src/user/user.service'

@Injectable()
export class CheckBlockMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new HttpException('Token không hợp lệ!', HttpStatus.UNAUTHORIZED)
    }

    const token = authorizationHeader.split(' ')[1]
    const decoded = this.jwtService.decode(token) as { userId: Types.ObjectId }
    if (!decoded) {
      throw new HttpException('Token không hợp lệ!', HttpStatus.UNAUTHORIZED)
    }

    const { userId } = decoded
    const targetUserId = req.params.targetUserId || req.body.targetUserId

    if (targetUserId) {
      const user = await this.userService.findUserById(targetUserId)
      if (user.blockedUsers.includes(userId)) {
        throw new HttpException('Bạn đã bị chặn', HttpStatus.FORBIDDEN)
      }
    }

    next()
  }
}
