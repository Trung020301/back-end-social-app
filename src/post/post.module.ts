import { Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostService } from './post.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Post, PostSchema } from 'src/schema/post.schema'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'
import { User, UserSchema } from 'src/schema/user.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, CloudinaryService],
  exports: [PostService],
})
export class PostModule {}
