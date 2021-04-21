import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "verification_requests" })
export class VerificationRequest extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar" })
  identifier: string;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  token: string;

  @Column({ type: "timestamptz" })
  expires: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
