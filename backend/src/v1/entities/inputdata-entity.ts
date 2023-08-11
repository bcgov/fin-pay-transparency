import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { ReportEntity } from "./report-entity";
@Entity("pay_transparency_input_data")
export class InputDataEntity {
  @PrimaryGeneratedColumn("uuid")
  input_data_id: string;

  @Column("uuid")
  report_id: string;

  @Column("varchar", { length: 10 })
  employee_number: string;

  @Column("varchar", { length: 1 })
  gender_code: string;

  @Column("numeric")
  hours_worked: number;

  @Column("numeric")
  regular_pay: number;

  @Column("numeric")
  special_pay: number;

  @Column("numeric")
  overtime_pay: number;

  @Column("numeric")
  overtime_hours: number;

  @Column("numeric")
  bonus_pay: number;


  @ManyToOne(
    () => ReportEntity,
    (report) => report.report_id
  )
  report: ReportEntity;
}
