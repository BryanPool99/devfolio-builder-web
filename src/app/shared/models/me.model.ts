import { Portfolio } from './portfolio.model';
import { User } from './user.model';

export interface MeResponse {
  user: User;
  portfolio: Portfolio;
}
