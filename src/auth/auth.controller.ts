import { Body, Controller, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { CreateUserDto } from 'src/dtos/user/create-user.dto'
import { SignInDto } from 'src/dtos/user/sign-in.dto'
import { RefreshTokensDto } from 'src/dtos/user/refresh-tokens.dto'
import { Public } from 'src/decorators/public.decorator'
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto)
  }

  @Public()
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto)
  }

  @Public()
  @Post('refresh-token')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokensDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken)
  }

  @Post('sign-out')
  async signOut(@Req() req) {
    return this.authService.signOut(req.user.userId)
  }
}
