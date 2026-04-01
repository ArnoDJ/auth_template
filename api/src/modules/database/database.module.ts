import { Global, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { TypeOrmConfigService } from "./typeOrmConfig.service"
import { TransactionalSetup } from "./transactionalSetup"

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [TransactionalSetup],
})
export class DatabaseModule {}
