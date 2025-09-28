import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../books/book.schema';
import { AiModule } from '../ai-helpers/ai.module';
import { ChatHistory, ChatHistorySchema } from './chat-history.schema';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema }
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
