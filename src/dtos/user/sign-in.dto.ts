import { IsString, Length } from 'class-validator'

export class SignInDto {
  @IsString()
  @Length(6, 24)
  username: string

  @IsString()
  @Length(6, 24)
  password: string
}
