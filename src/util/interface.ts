import { Types } from 'mongoose'

export interface IUserToken {
  userId: Types.ObjectId
  role: string
}

export interface IStoreToken {
  userId: Types.ObjectId
  token: string
  role: string
}
