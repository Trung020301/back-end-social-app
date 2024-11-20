import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { v4 as uuidv4 } from 'uuid'

import { CreateUserDto } from 'src/dtos/user/create-user.dto'
import { User } from 'src/schema/user.schema'
import { NOT_FOUND, USER_EXISTED, USER_NOT_FOUND } from 'src/util/constant'
import { SignInDto } from 'src/dtos/user/sign-in.dto'
import { RefreshToken } from 'src/schema/refresh-token.schema'
import { IStoreToken, IUserToken } from 'src/util/interface'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const existingUser = await this.UserModel.findOne({
      username: createUserDto.username,
    })
    if (existingUser) {
      throw new BadRequestException(USER_EXISTED)
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    await this.UserModel.create({
      ...createUserDto,
      password: hashedPassword,
    })
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.UserModel.findOne({
      username: signInDto.username,
    })
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }
    const isPasswordMatch = await bcrypt.compare(
      signInDto.password,
      user.password,
    )
    if (!isPasswordMatch) {
      throw new NotFoundException(NOT_FOUND)
    }
    const tokens = await this.generateUserTokens({
      userId: user._id,
      role: user.role,
    })
    return {
      ...tokens,
      userId: user._id,
    }
  }

  async signOut(userId: Types.ObjectId) {
    const token = await this.RefreshTokenModel.findOneAndDelete(userId)

    console.log('Token', token)

    if (!token) {
      throw new NotFoundException(NOT_FOUND)
    }
  }

  // * Common method
  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    })
    if (!token) {
      throw new UnauthorizedException()
    }
    return this.generateUserTokens({ userId: token.userId, role: token.role })
  }

  async generateUserTokens(payload: IUserToken) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' })
    const refreshToken = uuidv4()
    await this.storeRefreshToken({ token: refreshToken, ...payload })

    return { accessToken, refreshToken }
  }

  async storeRefreshToken(payload: IStoreToken) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 3)

    await this.RefreshTokenModel.updateOne(
      {
        userId: payload.userId,
      },
      {
        $set: {
          expiryDate,
          token: payload.token,
          role: payload.role,
        },
      },
      {
        upsert: true,
      },
    )
  }

  private async findUserById(userId: Types.ObjectId) {
    const user = await this.UserModel.findById(userId)
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND)
    }
    return user
  }
}
