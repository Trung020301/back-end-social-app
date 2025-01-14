import {
  MiddlewareConsumer,
  // MiddlewareConsumer,
  Module,
  NestModule,
  // NestModule,
  // RequestMethod,
} from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
// import { LoggerModule } from 'nestjs-pino'
import { AuthModule } from './auth/auth.module'
import { JwtModule } from '@nestjs/jwt'
import config from './config/config'
import { MongooseModule } from '@nestjs/mongoose'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from './guards/authentication.guard'
import { AuthorizationGuard } from './guards/authorization.guard'
import { PostModule } from './post/post.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module'
import { UserModule } from './user/user.module'
import { AdminModule } from './admin/admin.module'
// import { CheckBlockMiddleware } from './middlewares/user.middleware'
// import { PostController } from './post/post.controller'
import { CommentModule } from './comment/comment.module'
import { UserController } from './user/user.controller'
import { CheckBlockMiddleware } from './middlewares/check-block.middleware'
import { StoryModule } from './story/story.module';

// const options = {
//   colorize: true,
//   translateTime: 'SYS:standard',
//   ignore: 'pid,hostname',
//   messageKey: 'msg',
//   timestampKey: 'time',
//   customColors: 'error:red,info:blue',
// }

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [config],
    }),
    // LoggerModule.forRoot({
    //   pinoHttp: {
    //     transport: {
    //       target: 'pino-pretty',
    //       options,
    //     },
    //   },
    // }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
      global: true,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.connectionString'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    PostModule,
    CloudinaryModule,
    UserModule,
    AdminModule,
    CommentModule,
    StoryModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CheckBlockMiddleware).forRoutes(UserController)
  }
}
