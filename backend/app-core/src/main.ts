import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import  RedisStore  from 'connect-redis';
import Redis from 'ioredis'

import * as session from 'express-session';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  // const whitelist = [
  //   'http://localhost:4200',
  //   'http://localhost:6003',
  //   'http://127.0.0.1:4200',
  //   'http://127.0.0.1:6003',
  // ];
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:6003'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  app.setGlobalPrefix('api');
  
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true
  //   })
  // );
  //const RedisStore =  RedisStore(session);
  const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
  });
  
  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.TOKEN_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: parseInt(process.env.EXPIRE_IN) }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  await app.listen(process.env.PORT);
}
bootstrap();
