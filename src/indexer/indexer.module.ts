import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IndexerService } from "./indexer.service";
import { IndexedEvent } from "./entities/indexed-event.entity";

@Module({
  imports: [TypeOrmModule.forFeature([IndexedEvent])],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
