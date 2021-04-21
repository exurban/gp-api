import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "sessions" })
export class Session extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  userId: number;

  @Column({ type: "timestamptz" })
  expires: Date;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  sessionToken: string;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  accessToken: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
