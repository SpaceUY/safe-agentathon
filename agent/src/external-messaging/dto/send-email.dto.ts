import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Welcome!', description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '<h1>Hello</h1>', description: 'HTML email body' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class Send2FAEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  to: string;
}
