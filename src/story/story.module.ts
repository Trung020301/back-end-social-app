import { Module } from '@nestjs/common'
import { StoryService } from './story.service'
import { StoryController } from './story.controller'
import { Story, StorySchema } from 'src/schema/story.schema'
import { User, UserSchema } from 'src/schema/user.schema'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Story.name,
        schema: StorySchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [StoryService],
  controllers: [StoryController],
})
export class StoryModule {}
