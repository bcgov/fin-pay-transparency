import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import {CompanyUserEntity} from "./companyuser-entity";
import {ReportEntity} from "./report-entity";

@Entity("pay_transparency_user")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Column({ type: "uuid" })
  bceid_user_guid: string;

  @Column({ type: "uuid" })
  bceid_business_guid: string;

  @Column({ type: "varchar", length: 255 })
  display_name: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  create_date: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  update_date: Date;

  // Define one-to-many relation with pay_transparency_company_user
  @OneToMany(() => CompanyUserEntity, (companyUser) => companyUser.user)
  companyUsers: CompanyUserEntity[];

  // Define one-to-many relation with pay_transparency_report
  @OneToMany(() => ReportEntity, (report) => report.user)
  reports: ReportEntity[];
}
