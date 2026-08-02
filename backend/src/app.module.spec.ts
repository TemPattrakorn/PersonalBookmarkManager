import { Test } from "@nestjs/testing";
import { AppModule } from "./app.module";
import { PrismaService } from "./core/database/prisma.service";

describe("AppModule", () => {
  it("compiles with the Prisma provider", async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module.get(PrismaService).$disconnect).toEqual(expect.any(Function));
    await module.close();
  });
});
