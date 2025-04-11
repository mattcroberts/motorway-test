import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Source } from './source';

@Entity()
export class VehicleValuation {
  @PrimaryColumn({ length: 7 })
  vrm: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lowestValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  highestValue: number;

  @Column({ type: 'varchar', nullable: true })
  source?: Source;

  get midpointValue(): number {
    return (this.highestValue + this.lowestValue) / 2;
  }
}
