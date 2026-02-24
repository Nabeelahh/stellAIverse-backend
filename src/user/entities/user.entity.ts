import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum UserRole {
  USER = "user",
  OPERATOR = "operator",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: false })
  @Index()
  walletAddress: string;

  @Column({ unique: true, nullable: true })
  @Index()
  email: string | null;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({
    type: "varchar",
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
