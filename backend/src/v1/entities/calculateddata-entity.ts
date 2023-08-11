import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import {ReportEntity} from "./report-entity";

@Entity("pay_transparency_calculated_data")
export class CalculatedDataEntity {
  @PrimaryGeneratedColumn("uuid")
  calculated_data_id: string;

  @Column("uuid")
  report_id: string;


  @Column("numeric")
  average_hourly_wage: number;


  @ManyToOne(
    () => ReportEntity,
    (report) => report.report_id
  )
  report: ReportEntity;
}
