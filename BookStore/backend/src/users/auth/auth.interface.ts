import { FastifyRequest } from 'fastify';
import { UserDocument } from '../user.schema';  // Import User từ module user

export interface AuthenticatedRequest extends FastifyRequest {
  user?: UserDocument;
}