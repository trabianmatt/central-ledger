SELECT DISTINCT ET."transferId" AS "transferId", A1."name" AS "creditAccountName", A2."name" AS "debitAccountName", T."creditAmount" AS "creditAmount", T."debitAmount" AS "debitAmount"
FROM (
	"executedTransfers" AS ET LEFT JOIN "settledTransfers" AS ST ON ET."transferId" = ST."transferId"
	)
INNER JOIN "transfers" AS T
ON T."transferUuid" = ET."transferId" 
INNER JOIN "accounts" AS A1
ON A1."accountId" = T."creditAccountId"
INNER JOIN "accounts" AS A2
ON A2."accountId" = T."debitAccountId"
WHERE ST."transferId" IS NULL;
