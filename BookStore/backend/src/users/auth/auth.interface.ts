import { FastifyRequest } from 'fastify';
import { User } from '../user.schema';  // Import User từ module user

export interface AuthenticatedRequest extends FastifyRequest {
  user?: User;
}