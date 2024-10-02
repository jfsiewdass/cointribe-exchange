import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL),
      limit: parseInt(process.env.RATE_LIMIT)
    }]),
    MongooseModule.forRoot(process.env.DB_URI)
  ],
  providers: [AppService],
})
export class AppModule {}
