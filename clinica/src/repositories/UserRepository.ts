import { AppDataSource } from '../database/data-source';
import { User } from '../entities/User';

export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  },

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  },

  findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } });
  },
});
