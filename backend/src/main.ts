import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnvironment } from "./core/config/load-environment";

async function bootstrap(): Promise<void> {
  loadEnvironment();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:3000" });
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
