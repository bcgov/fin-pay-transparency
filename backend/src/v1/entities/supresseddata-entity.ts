import {Entity, PrimaryColumn, Column, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {ReportEntity} from "./report-entity";

@Entity("pay_transparency_suppressed_report_data")
export class SuppressedReportDataEntity {
  @PrimaryGeneratedColumn("uuid")
  suppressed_report_data_id: string;


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
