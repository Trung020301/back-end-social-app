import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserController } from './user.controller'

// *Service
import { UserService } from './user.service'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

// *Schema
import { User, UserSchema } from 'src/schema/user.schema'
import { RefreshToken } from 'src/schema/refresh-token.schema'
import { Post, PostSchema } from 'src/schema/post.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: RefreshToken.name,
        schema: RefreshToken,
      },
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, CloudinaryService],
  exports: [UserService],
})
export class UserModule {}
