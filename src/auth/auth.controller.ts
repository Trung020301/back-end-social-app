import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CreateUserDto } from 'src/dtos/user/create-user.dto'
import { SignInDto } from 'src/dtos/user/sign-in.dto'
import { RefreshTokensDto } from 'src/dtos/user/refresh-tokens.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto)
  }

  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto)
  }

  @Post('refresh-token')
  async RefreshTokens(@Body() refreshTokenDto: RefreshTokensDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken)
  }
}
