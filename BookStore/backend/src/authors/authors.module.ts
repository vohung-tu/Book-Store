import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Author, AuthorSchema } from "./authors.schema";
import { AuthorsService } from "./authors.service";
import { AuthorsController } from "./authors.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }])
  ],
  providers: [AuthorsService],
  controllers: [AuthorsController] ,
  exports: [MongooseModule],
})
export class AuthorsModule {}