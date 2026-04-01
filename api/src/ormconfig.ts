import * as dotenv from "dotenv"
import { resolve } from "path"
import { DataSource } from "typeorm"

const envFile = `.env${process.env.NODE_ENV ? "." + process.env.NODE_ENV : ""}`
dotenv.config({ path: resolve(process.cwd(), envFile) })
const getEnvOrThrow = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }

  return value
}

const getNumberEnvOrThrow = (name: string): number => {
  const value = getEnvOrThrow(name)
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric env var: ${name}`)
  }

  return parsed
}

const getBooleanEnv = (name: string, isDefaultValue: boolean = false): boolean => {
  const value = process.env[name]
  if (!value) {
    return isDefaultValue
  }

  return value.toLowerCase() === "true"
}

export default new DataSource({
  type: "postgres",
  host: getEnvOrThrow("POSTGRES_HOST"),
  port: getNumberEnvOrThrow("POSTGRES_PORT"),
  username: getEnvOrThrow("POSTGRES_USERNAME"),
  password: getEnvOrThrow("POSTGRES_PASSWORD"),
  database: getEnvOrThrow("POSTGRES_DATABASE"),
  entities: [__dirname + "/modules/**/entities/*{.js,.ts}"],
  migrations: [__dirname + "/migrations/*{.js,.ts}"],
  synchronize: false,
  logging: getBooleanEnv("LOG_SQL"),
})
