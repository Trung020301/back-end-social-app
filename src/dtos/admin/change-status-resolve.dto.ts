import { IsMongoId, IsNotEmpty } from 'class-validator'
import { Types } from 'mongoose'

export class ChangeStatusResolveDto {
  @IsMongoId()
  @IsNotEmpty()
  reportedPostId: Types.ObjectId

  @IsNotEmpty()
  resolve: boolean
}
