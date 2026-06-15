export function getDatabaseErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (
    message.includes("Environment variable not found: DATABASE_URL") ||
    message.includes("Can't reach database server") ||
    message.includes("Can't reach database")
  ) {
    return "Banco de dados PostgreSQL não configurado ou indisponível. Configure o DATABASE_URL e execute a migration.";
  }

  return "Erro de banco de dados.";
}

export function isDatabaseSetupError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("Environment variable not found: DATABASE_URL") ||
    message.includes("Can't reach database server") ||
    message.includes("Can't reach database")
  );
}

