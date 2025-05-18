import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { Author } from './authors.schema';

@Injectable()
export class AuthorsService {
  constructor(@InjectModel(Author.name) private authorModel: Model<Author>) {}

  async findAll(): Promise<Author[]> {
    return this.authorModel.find().sort({ dateUpdate: -1 }).exec();
  }

  async findById(id: string): Promise<Author | null> {
    return this.authorModel.findById(id).exec();
  }

  async create(authorDto: Partial<Author>): Promise<Author> {
    const created = new this.authorModel(authorDto);
    return created.save();
  }

  async update(id: string, authorDto: Partial<Author>): Promise<Author | null> {
    return this.authorModel.findByIdAndUpdate(id, authorDto, { new: true }).exec();
  }

  async delete(id: string): Promise<Author | null> {
    return this.authorModel.findByIdAndDelete(id).exec();
  }
}
