import {ManyToOne, PrimaryGeneratedColumn} from "typeorm";

const {Entity, JoinColumn, OneToMany, PrimaryColumn, Column} = require('typeorm');
import {UserEntity} from "./user-entity";
import {CompanyUserEntity} from "./companyuser-entity";

@Entity('pay_transparency_company')
export class CompanyEntity {

  @PrimaryGeneratedColumn("uuid")
  company_id: string;

  @Column({ type: "uuid" })
  bceid_business_guid: string;

  @Column({ type: "varchar", length: 255 })
  company_name: string;

  @Column({ type: "varchar", length: 255 })
  company_address: string;

  @Column({ type: "varchar", length: 255 })
  naics_code: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  create_date: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  update_date: Date;

  // Define one-to-many relation with pay_transparency_company_user
  @OneToMany(() => CompanyUserEntity, (companyUser) => companyUser.company)
  companyUsers: CompanyUserEntity[];
}
