import { IsString, Length, Matches } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @Length(3, 24)
  @Matches(/^[A-Za-z\s]+$/, { message: 'fullName không được có số' })
  fullName: string

  @IsString()
  @Length(6, 24)
  @Matches(/^\S*$/, { message: 'username không được có kí tự trống' })
  username: string

  @IsString()
  @Length(6, 24)
  password: string
}
