import {CompanyEntity} from "./company-entity";
import {UserEntity} from "./user-entity";
import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";

@Entity('pay_transparency_company_user')
export class CompanyUserEntity {
  @PrimaryColumn("uuid")
  company_id: string;

  @PrimaryColumn("uuid")
  user_id: string;

  @ManyToOne(
    () => CompanyEntity,
    (company) => company.company_id
  )
  company: CompanyEntity;

  @ManyToOne(() => UserEntity, (user) => user.user_id)
  user: UserEntity;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  create_date: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  update_date: Date;
}
