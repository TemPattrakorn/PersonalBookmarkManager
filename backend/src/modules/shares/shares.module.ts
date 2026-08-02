import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/database/prisma.module";
import { CollectionsModule } from "../collections/collections.module";
import { SharesController } from "./shares.controller";
import { SharesService } from "./shares.service";

@Module({
  imports: [PrismaModule, CollectionsModule],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
