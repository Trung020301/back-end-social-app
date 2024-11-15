import { IsString, MaxLength, MinLength } from 'class-validator'

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  oldPassword: string

  @IsString()
  @MinLength(6)
  @MaxLength(24)
  newPassword: string
}
