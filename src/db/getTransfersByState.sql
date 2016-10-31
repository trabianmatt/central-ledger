SELECT t.*, ca.name AS "creditAccountName", da.name AS "debitAccountName" FROM transfers t, accounts da, accounts ca WHERE t.state = $1 AND da."accountId" = t."debitAccountId" AND ca."accountId" = t."creditAccountId";