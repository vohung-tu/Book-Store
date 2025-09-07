import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],   // Controller để expose API
  providers: [AiService],        // Service xử lý logic gọi OpenRouter
  exports: [AiService],          // Export nếu module khác cần dùng AI
})
export class AiModule {}
