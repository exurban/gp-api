import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'accounts' })
export default class Account extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  compoundId: string;

  @Index('userId')
  @Column()
  userId: number;

  @Column('varchar')
  providerType: string;

  @Index('providerId')
  @Column({ type: 'varchar' })
  providerId: string;

  @Index('providerAccountId')
  @Column({ type: 'varchar' })
  providerAccountId: string;

  @Column('text', { nullable: true })
  refreshToken: string;

  @Column('text', { nullable: true })
  accessToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  accessTokenExpires: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
