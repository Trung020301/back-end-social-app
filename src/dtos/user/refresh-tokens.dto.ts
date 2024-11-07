import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokensDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
