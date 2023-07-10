import {Column, Entity, JoinColumn, ManyToOne, PrimaryColumn} from "typeorm";

import {CompanyEntity} from './company-entity';

@Entity('report')
export class ReportEntity {

  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => CompanyEntity, (companyEntity) => companyEntity.reports)
  @JoinColumn({name: 'company_id'})
  company: CompanyEntity;

  @Column({type: 'numeric'})
  create_date;

  @Column({type: 'varchar', length: 200})
  report_data;
}
