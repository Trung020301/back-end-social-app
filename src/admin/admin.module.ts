import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/schema/user.schema'
import { Post, PostSchema } from 'src/schema/post.schema'
import {
  ReportedPost,
  ReportedPostSchema,
} from 'src/schema/reported-post.schema'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Post.name,
        schema: PostSchema,
      },
      {
        name: ReportedPost.name,
        schema: ReportedPostSchema,
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, CloudinaryService],
})
export class AdminModule {}
