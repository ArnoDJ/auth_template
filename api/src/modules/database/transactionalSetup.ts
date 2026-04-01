import { Injectable, OnModuleInit } from "@nestjs/common"
import { DataSource } from "typeorm"
import { addTransactionalDataSource } from "typeorm-transactional"

@Injectable()
export class TransactionalSetup implements OnModuleInit {
  private static initialized = false

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    if (!TransactionalSetup.initialized) {
      addTransactionalDataSource(this.dataSource)
      TransactionalSetup.initialized = true
    }
  }
}
