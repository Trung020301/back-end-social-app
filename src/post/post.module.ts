import { Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostService } from './post.service'
import { MongooseModule } from '@nestjs/mongoose'
import { PostSchema } from 'src/schema/post.schema'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Post',
        schema: PostSchema,
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, CloudinaryService],
})
export class PostModule {}
