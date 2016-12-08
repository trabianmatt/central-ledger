ALTER TABLE transfers ALTER COLUMN "rejectionReason" TYPE CHARACTER VARYING(10) 
USING substr("rejectionReason", 1, 10)