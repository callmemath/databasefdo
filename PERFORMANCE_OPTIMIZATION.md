# Ottimizzazioni Database Performance

## Configurazioni consigliate per MySQL/MariaDB

### Nel file my.cnf o my.ini (per il server MySQL):

```ini
[mysqld]
# Pool di connessioni
max_connections = 100
thread_cache_size = 8

# Buffer pool (regola in base alla RAM disponibile)
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M

# Query cache (se MySQL < 8.0)
query_cache_type = 1
query_cache_size = 64M

# Ottimizzazioni generali
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
```

### Variabili d'ambiente per Prisma (nel file .env):

```env
# Connection pooling per Prisma
DATABASE_URL="mysql://user:password@localhost:3306/database?connection_limit=10&pool_timeout=20&connect_timeout=10"

# Per performance in produzione
NODE_ENV=production
```

## Altre ottimizzazioni

1. **Indici database**: Assicurati che le colonne usate nelle query WHERE, JOIN e ORDER BY abbiano indici
2. **Connection pooling**: Prisma gestisce automaticamente il pool con i parametri nell'URL
3. **Cache**: Le API usano ora cache in memoria per ridurre le query al database
4. **Lazy loading**: I componenti non critici vengono caricati solo quando necessari

## Comandi utili

```bash
# Ottimizza le tabelle MySQL
mysqlcheck -o database_name --user=root --password

# Analizza le query lente
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```
