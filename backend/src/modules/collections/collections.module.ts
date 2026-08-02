import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/database/prisma.module";
import { CollectionsController } from "./collections.controller";
import { CollectionsService } from "./collections.service";

@Module({
  imports: [PrismaModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
