const {Entity, JoinColumn, OneToMany, PrimaryColumn, Column} = require('typeorm');
import {ReportEntity} from './report-entity';

@Entity('company')
export class CompanyEntity {

  @PrimaryColumn('uuid')
  id: string;

  @Column({type: 'varchar', length: 200})
  name: string;

  @Column({type: 'varchar', length: 200})
  address: string;

  @Column({type: 'numeric'})
  number_of_employees: number;

  @OneToMany(() => ReportEntity, report => report.company, {
    lazy: true,
    cascade: true,
    orphanedRowAction: 'delete'
  })
  reports: Promise<ReportEntity[]>;
}
