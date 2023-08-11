import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";

import {CompanyEntity} from './company-entity';
import {UserEntity} from "./user-entity";
import {InputDataEntity} from "./inputdata-entity";
import {SuppressedReportDataEntity} from "./supresseddata-entity";
import {CalculatedDataEntity} from "./calculateddata-entity";

@Entity('pay_transparency_report')
export class ReportEntity {

  @PrimaryGeneratedColumn("uuid")
  report_id: string;

  @Column("uuid")
  company_id: string;

  @Column("uuid")
  user_id: string;

  @Column("varchar", { length: 255 })
  employee_count: string;

  @Column("varchar", { length: 4000 })
  user_comment: string;

  @Column("bytea")
  report_data: Buffer;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  report_start_date: Date;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  report_end_date: Date;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  create_date: Date;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  update_date: Date;


  @ManyToOne(
    () => CompanyEntity,
    (company) => company.company_id
  )
  company: CompanyEntity;


  @ManyToOne(() => UserEntity, (user) => user.user_id)
  user: UserEntity;

  @OneToMany(
    () => InputDataEntity,
    (inputData) => inputData.report
  )
  inputDataList: InputDataEntity[];

  @OneToMany(
    () => CalculatedDataEntity,
    (calculatedData) => calculatedData.report
  )
  calculatedDataList: CalculatedDataEntity[];

  @OneToMany(
    () => SuppressedReportDataEntity,
    (suppressedReportData) => suppressedReportData.report
  )
  suppressedReportDataList: SuppressedReportDataEntity[];
}
