import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Source } from './source';

@Entity({ name: 'ProviderLogs' })
export class RequestAuditEntry {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'datetime' })
  requestDate: Date;

  @Column({ type: 'decimal' })
  requestDuration: number;

  @Column({ type: 'varchar' })
  requestUrl: string;

  @Column({ type: 'int' })
  responseCode: number;

  @Column({ type: 'varchar', nullable: true })
  error?: string;

  @Column({ type: 'varchar', nullable: true })
  provider?: Source;

  @Column({ type: 'varchar', nullable: true })
  vrm?: string;
}
