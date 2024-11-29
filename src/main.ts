import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino'
import { ValidationPipe } from '@nestjs/common'
import { AllExceptionsFilter } from './exception-filters/all-exception.filter'
// import { corsOptions } from './cors/corsConfig'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useLogger(app.get(Logger))
  app.useGlobalInterceptors(new LoggerErrorInterceptor())

  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter))
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.enableCors({
    origin: ['https://next-social-client.vercel.app', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept',
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
