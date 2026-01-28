import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { ComputeModule } from './compute/compute.module';
import { User } from './user/entities/user.entity';
import { EmailVerification } from './auth/entities/email-verification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: (config) => {
        // Validate critical environment variables
        const required = ['DATABASE_URL', 'JWT_SECRET'];
        for (const key of required) {
          if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return config;
      },
    }),
    // Rate Limiting - Global protection against brute force and DoS
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window in milliseconds (1 minute)
      limit: 100, // Max requests per TTL per IP
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        
        if (isProduction && !configService.get('DATABASE_URL')) {
          throw new Error('DATABASE_URL must be set in production');
        }

        return {
          type: 'postgres',
          url: configService.get('DATABASE_URL'),
          entities: [User, EmailVerification],
          synchronize: false, // NEVER use synchronize in production
          logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn', 'schema'] : ['error'],
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: {
            max: 20, // Maximum pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    ProfileModule,
    ComputeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
